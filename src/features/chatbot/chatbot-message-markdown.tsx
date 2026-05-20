import type { ReactNode } from "react";
import { resolveLecotLinkHref } from "@/features/chatbot/chatbot-lecot-url";

const INLINE_LINK_RE = /\[([^\]]+)\]\(((?:lecot:|https?:\/\/)[^)]+)\)/g;

/** Rendu léger : gras, liens `[label](lecot:…)` et `[label](https://…)`. */
export function renderChatbotInline(text: string): ReactNode {
  const nodes: ReactNode[] = [];
  let last = 0;
  let key = 0;
  const re = new RegExp(INLINE_LINK_RE.source, "g");
  let match = re.exec(text);
  while (match) {
    if (match.index > last) {
      nodes.push(...renderBoldChunks(text.slice(last, match.index), key));
      key += 1;
    }
    const label = match[1];
    const href = resolveLecotLinkHref(match[2]);
    nodes.push(
      <a
        key={`link-${key}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        data-testid="chatbot-lecot-link"
        className="font-semibold text-indigo-600 underline underline-offset-2 hover:text-indigo-800"
      >
        {label}
      </a>,
    );
    key += 1;
    last = match.index + match[0].length;
    match = re.exec(text);
  }
  if (last < text.length) {
    nodes.push(...renderBoldChunks(text.slice(last), key));
  }
  return nodes.length === 1 ? nodes[0] : nodes;
}

function renderBoldChunks(text: string, keyStart: number): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`b-${keyStart}-${i}`} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part ? <span key={`t-${keyStart}-${i}`}>{part}</span> : null;
  }).filter(Boolean) as ReactNode[];
}

function isTableRow(line: string) {
  return line.trimStart().startsWith("|") && line.trimEnd().endsWith("|");
}

export function renderChatbotMarkdownLite(text: string): ReactNode {
  const lines = text.split("\n");
  const out: ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (isTableRow(line)) {
      const tableLines: string[] = [];
      while (i < lines.length && (isTableRow(lines[i]) || /^[\s|:-]+$/.test(lines[i]))) {
        tableLines.push(lines[i]);
        i++;
      }
      const [header, , ...body] = tableLines;
      const cols = (header ?? "").split("|").filter(Boolean).map((c) => c.trim());
      out.push(
        <div key={`tbl-${i}`} className="my-2 overflow-x-auto rounded-[10px] border border-slate-200">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-slate-50">
                {cols.map((c, ci) => (
                  <th key={ci} className="border-b border-slate-200 px-3 py-1.5 text-left font-semibold text-slate-700">
                    {renderChatbotInline(c)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, ri) => {
                const cells = row.split("|").filter(Boolean).map((c) => c.trim());
                return (
                  <tr key={ri} className={ri % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                    {cells.map((c, ci) => (
                      <td key={ci} className="border-b border-slate-100 px-3 py-1.5 text-slate-800">
                        {renderChatbotInline(c)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    const isLast = i === lines.length - 1;
    const br = !isLast ? <br /> : null;

    if (/^#{1,3} /.test(line)) {
      out.push(
        <span key={i} className="block font-bold text-[15px] mt-2 mb-0.5">
          {renderChatbotInline(line.replace(/^#+\s/, ""))}
          {br}
        </span>,
      );
    } else if (/^\d+\. /.test(line)) {
      const num = line.match(/^(\d+)\. /)?.[1] ?? "";
      out.push(
        <span key={i} className="block pl-4">
          <span className="mr-1.5 font-semibold text-slate-500">{num}.</span>
          {renderChatbotInline(line.replace(/^\d+\. /, ""))}
          {br}
        </span>,
      );
    } else if (/^[-*] /.test(line)) {
      out.push(
        <span key={i} className="block pl-3 before:content-['•'] before:mr-1.5 before:text-slate-400">
          {renderChatbotInline(line.slice(2))}
          {br}
        </span>,
      );
    } else {
      out.push(
        <span key={i}>
          {renderChatbotInline(line)}
          {br}
        </span>,
      );
    }
    i++;
  }
  return out;
}
