import React, { useMemo } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Enter description...",
  className,
  disabled = false,
}) => {
  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link"],
        [{ align: [] }],
        ["clean"],
      ],
      clipboard: {
        matchVisual: false,
      },
    }),
    []
  );

  return (
    <div className={cn("rich-text-editor-wrapper", className)}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        placeholder={placeholder}
        readOnly={disabled}
        style={{
          minHeight: "200px",
          maxHeight: "400px",
        }}
      />
      <style>{`
        .rich-text-editor-wrapper .ql-container {
          font-family: inherit;
          font-size: 14px;
          min-height: 200px;
          max-height: 400px;
          overflow-y: auto;
        }
        .rich-text-editor-wrapper .ql-editor {
          min-height: 200px;
        }
        .rich-text-editor-wrapper .ql-editor.ql-blank::before {
          color: hsl(var(--muted-foreground));
          font-style: normal;
        }
        .rich-text-editor-wrapper .ql-toolbar {
          border-top-left-radius: calc(var(--radius) - 2px);
          border-top-right-radius: calc(var(--radius) - 2px);
          border-bottom: 1px solid hsl(var(--border));
          background: hsl(var(--background));
        }
        .rich-text-editor-wrapper .ql-container {
          border-bottom-left-radius: calc(var(--radius) - 2px);
          border-bottom-right-radius: calc(var(--radius) - 2px);
          border: 1px solid hsl(var(--border));
        }
        .rich-text-editor-wrapper .ql-stroke {
          stroke: hsl(var(--foreground));
        }
        .rich-text-editor-wrapper .ql-fill {
          fill: hsl(var(--foreground));
        }
        .rich-text-editor-wrapper .ql-picker-label {
          color: hsl(var(--foreground));
        }
        .rich-text-editor-wrapper .ql-editor {
          color: hsl(var(--foreground));
        }
        .rich-text-editor-wrapper .ql-editor a {
          color: hsl(var(--primary));
        }
      `}</style>
    </div>
  );
};
