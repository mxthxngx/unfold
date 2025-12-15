import type { EditorView } from "@tiptap/pm/view";

export const handleImagePaste = (
  view: EditorView,
  event: ClipboardEvent,
  noteId: string,
) => {
  if (event.clipboardData?.files.length) {
    event.preventDefault();
    
    for (const file of event.clipboardData.files) {
      // Only handle image files
      if (file.type.startsWith("image/")) {
        const pos = view.state.selection.from;
        uploadImageFromFile(file, view, pos, noteId);
      }
    }
    return true;
  }
  return false;
};

export const handleImageDrop = (
  view: EditorView,
  event: DragEvent,
  moved: boolean,
  noteId: string,
) => {
  if (!moved && event.dataTransfer?.files.length) {
    event.preventDefault();

    for (const file of event.dataTransfer.files) {
      // Only handle image files
      if (file.type.startsWith("image/")) {
        const coordinates = view.posAtCoords({
          left: event.clientX,
          top: event.clientY,
        });

        uploadImageFromFile(file, view, coordinates?.pos ?? 0, noteId);
      }
    }
    return true;
  }
  return false;
};

async function uploadImageFromFile(
  file: File,
  view: EditorView,
  pos: number,
  noteId: string,
) {
  const { uploadImage } = await import("@/utils/invoke");
  const { convertFileSrc } = await import("@tauri-apps/api/core");
  
  // Convert file to base64
  const base64 = await fileToBase64(file);
  
  // Generate a unique ID for this upload to track the placeholder
  const uploadId = `uploading-${Date.now()}-${Math.random()}`;
  
  // Insert placeholder node
  const tr = view.state.tr;
  const imageNode = view.state.schema.nodes.image.create({
    src: "",
    attachmentId: uploadId,
    size: file.size,
  });
  tr.insert(pos, imageNode);
  view.dispatch(tr);

  try {
    // Upload image via Tauri command
    const result = await uploadImage({
      noteId,
      fileName: file.name,
      base64Data: base64,
      mimeType: file.type,
      size: file.size,
    });

    // Convert the file path to a valid URL for Tauri
    const assetUrl = convertFileSrc(result.path);

    // Find the placeholder node by searching for the uploadId
    const { state } = view;
    let foundPos: number | null = null;
    
    state.doc.descendants((node, pos) => {
      if (node.type.name === "image" && node.attrs.attachmentId === uploadId) {
        foundPos = pos;
        return false; // Stop searching
      }
      return true;
    });

    // Update the node with the actual image data if we found it
    if (foundPos !== null) {
      const updateTr = state.tr;
      updateTr.setNodeMarkup(foundPos, undefined, {
        src: assetUrl,
        attachmentId: result.id,
        size: result.size,
        alt: file.name,
      });
      view.dispatch(updateTr);
    }
  } catch (error) {
    console.error("Failed to upload image:", error);
    
    // Find and remove the placeholder node by searching for the uploadId
    const { state } = view;
    let foundPos: number | null = null;
    
    state.doc.descendants((node, pos) => {
      if (node.type.name === "image" && node.attrs.attachmentId === uploadId) {
        foundPos = pos;
        return false; // Stop searching
      }
      return true;
    });
    
    if (foundPos !== null) {
      const deleteTr = state.tr;
      deleteTr.delete(foundPos, foundPos + 1);
      view.dispatch(deleteTr);
    }
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
