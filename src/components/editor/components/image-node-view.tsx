import { NodeViewWrapper } from "@tiptap/react";
import { NodeViewProps } from "@tiptap/core";
import { useEffect, useState } from "react";

export const ImageNodeView = ({ node, updateAttributes }: NodeViewProps) => {
  const { src, attachmentId, alt, align, width } = node.attrs;
  const [loading, setLoading] = useState(!src && attachmentId === "uploading");
  const [error, setError] = useState(false);

  useEffect(() => {
    // Update loading state when src changes
    if (src && attachmentId !== "uploading") {
      setLoading(false);
    }
  }, [src, attachmentId]);

  const handleImageLoad = () => {
    setLoading(false);
    setError(false);
  };

  const handleImageError = () => {
    setLoading(false);
    setError(true);
  };

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
          onLoad={handleImageLoad}
          onError={handleImageError}
          draggable={false}
        />
      </div>
    </NodeViewWrapper>
  );
};
