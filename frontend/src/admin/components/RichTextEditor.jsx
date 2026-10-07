import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Extension } from "@tiptap/core";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Minus,
} from "lucide-react";

const FONT_SIZES = [
  "12px",
  "14px",
  "16px",
  "18px",
  "20px",
  "24px",
  "28px",
  "32px",
];
const COLORS = [
  "#1a1a1a",
  "#1a5242",
  "#d4af37",
  "#ef4444",
  "#3b82f6",
  "#8b5cf6",
  "#f97316",
  "#6b7280",
];

const FontSize = Extension.create({
  name: "fontSize",
  addGlobalAttributes() {
    return [
      {
        types: ["textStyle"],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (el) => el.style.fontSize || null,
            renderHTML: (attrs) => {
              if (!attrs.fontSize) return {};
              return { style: `font-size: ${attrs.fontSize}` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize:
        (fontSize) =>
        ({ chain }) => {
          return chain().setMark("textStyle", { fontSize }).run();
        },
    };
  },
});

const BTN = (active) =>
  `w-8 h-8 flex items-center justify-center rounded transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-200 ${active ? "bg-gray-200 text-gray-900" : ""}`;

export default function RichTextEditor({ value, onChange, placeholder }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true, keepAttributes: true },
        orderedList: { keepMarks: true, keepAttributes: true },
      }),
      Underline,
      TextStyle,
      Color,
      FontSize,
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-1 px-2 sm:px-3 py-2 bg-gray-50 border-b border-gray-200 flex-wrap">
        {/* Gras, Italique, Souligné */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={BTN(editor.isActive("bold"))}
          title="Gras"
        >
          <Bold size={15} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={BTN(editor.isActive("italic"))}
          title="Italique"
        >
          <Italic size={15} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={BTN(editor.isActive("underline"))}
          title="Souligné"
        >
          <UnderlineIcon size={15} />
        </button>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        {/* Taille de police */}
        <select
          onChange={(e) => {
            if (e.target.value) {
              editor.chain().focus().setFontSize(e.target.value).run();
            }
          }}
          className="h-7 px-1 text-[12px] border border-gray-200 rounded bg-white text-gray-600 outline-none"
          defaultValue=""
        >
          <option value="" disabled>
            Taille
          </option>
          {FONT_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        {/* Couleurs */}
        <div className="flex items-center gap-0.5">
          {COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => editor.chain().focus().setColor(color).run()}
              className="w-5 h-5 rounded-full border border-gray-300 hover:scale-110 transition-transform"
              style={{ background: color }}
              title={color}
            />
          ))}
          <input
            type="color"
            onChange={(e) =>
              editor.chain().focus().setColor(e.target.value).run()
            }
            className="w-6 h-6 rounded cursor-pointer border border-gray-200"
            title="Couleur personnalisée"
          />
        </div>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        {/* Listes */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={BTN(editor.isActive("bulletList"))}
          title="Liste à puces"
        >
          <List size={15} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={BTN(editor.isActive("orderedList"))}
          title="Liste numérotée"
        >
          <ListOrdered size={15} />
        </button>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        {/* Séparateur */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className={BTN(false)}
          title="Séparateur"
        >
          <Minus size={15} />
        </button>

        {/* Effacer formatage */}
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().unsetAllMarks().clearNodes().run()
          }
          className={BTN(false)}
          title="Effacer formatage"
        >
          <span className="text-[11px] font-bold">Tx</span>
        </button>
      </div>

      <EditorContent
        editor={editor}
        className="min-h-[120px] px-4 py-3 text-[13.5px] text-gray-800"
      />

      <style>{`
        .ProseMirror { outline: none; min-height: 120px; }
        .ProseMirror p { margin: 0 0 6px 0; }
        .ProseMirror p:last-child { margin-bottom: 0; }
        .ProseMirror strong { font-weight: 700 !important; }
        .ProseMirror em { font-style: italic !important; }
        .ProseMirror u { text-decoration: underline !important; }
        .ProseMirror ul { list-style-type: disc !important; padding-left: 20px !important; margin: 4px 0; }
        .ProseMirror ol { list-style-type: decimal !important; padding-left: 20px !important; margin: 4px 0; }
        .ProseMirror li { display: list-item !important; margin-bottom: 2px; }
        .ProseMirror li p { margin: 0 !important; display: inline !important; }
        .ProseMirror li strong { font-weight: 700 !important; }
        .ProseMirror li em { font-style: italic !important; }
        .ProseMirror li u { text-decoration: underline !important; }
        .ProseMirror hr { border: none; border-top: 1px solid #e5e7eb; margin: 16px 0; }
        .ProseMirror span[style] { display: inline; }
      `}</style>
    </div>
  );
}
