import { NodeViewWrapper } from "@tiptap/react";
import { NodeViewProps } from "@tiptap/core";
import { useMemo } from "react";

export const ImageNodeView = ({ node }: NodeViewProps) => {
  const { src, attachmentId, alt, align, width, height } = node.attrs;
  
  // Compute loading and error states based on node attributes
  const loading = useMemo(() => !src && attachmentId === "uploading", [src, attachmentId]);
  const error = useMemo(() => !src && attachmentId && attachmentId !== "uploading", [src, attachmentId]);

  const getAlignmentClass = () => {
    switch (align) {
      case "left":
        return "image-align-left";
      case "right":
        return "image-align-right";
      case "center":
      default:
        return "image-align-center";
    }
  };

  if (loading) {
    return (
      <NodeViewWrapper className="image-node">
        <div
          className={`image-wrapper ${getAlignmentClass()}`}
          style={{ width: width || "100%" }}
        >
          <div className="image-loading">
            <div className="spinner" />
            <span>Uploading image...</span>
          </div>
        </div>
      </NodeViewWrapper>
    );
  }

  if (error) {
    return (
      <NodeViewWrapper className="image-node">
        <div
          className={`image-wrapper ${getAlignmentClass()}`}
          style={{ width: width || "100%" }}
        >
          <div className="image-error">
            <span>Failed to load image</span>
          </div>
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className="image-node">
      <div
        className={`image-wrapper ${getAlignmentClass()}`}
        style={{ width: width || "100%" }}
      >
        <img
          src={src}
          alt={alt || ""}
          draggable={false}
          style={{
            maxHeight: height || "600px",
            maxWidth: "100%",
            width: "auto",
            height: "auto",
            objectFit: "contain"
          }}
        />
      </div>
    </NodeViewWrapper>
  );
};
