"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function CommandHelp() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // ? 키 (Shift+/) — input/textarea 안에서는 무시
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        const t = e.target as HTMLElement;
        if (t.tagName === "INPUT" || t.tagName === "TEXTAREA") return;
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const modal = open ? (
    <div className="modal-backdrop" onClick={() => setOpen(false)}>
      <div className="modal cmd-help-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cmd-help-head">
          <h3>명령어 / 단축키</h3>
          <button
            type="button"
            className="cmd-help-close"
            onClick={() => setOpen(false)}
            aria-label="닫기"
          >×</button>
        </div>
        <table className="cmd-help-table">
          <tbody>
            <tr>
              <td><code>/cc 기능 X</code></td>
              <td>1d100 ≤ X 판정. 기능명 같이 기록</td>
            </tr>
            <tr>
              <td><code>/cc X</code></td>
              <td>이름 없이 1d100 ≤ X 판정</td>
            </tr>
            <tr>
              <td><code>/roll NdM±K</code></td>
              <td>임의 다이스 (예: 2d6+3, 3d10)</td>
            </tr>
            <tr>
              <td><code>/r NdM±K</code></td>
              <td><code>/roll</code> 의 단축</td>
            </tr>
            <tr>
              <td className="cmd-help-spacer" colSpan={2}>줄 끝에 붙여도 동작</td>
            </tr>
            <tr>
              <td><code>책을 살핀다 /cc 도서관 60</code></td>
              <td>텍스트 + 굴림이 한 글에 같이 기록</td>
            </tr>
            <tr>
              <td className="cmd-help-spacer" colSpan={2}>단축키</td>
            </tr>
            <tr>
              <td><kbd>/</kbd></td>
              <td>사이트 전체 검색</td>
            </tr>
            <tr>
              <td><kbd>?</kbd></td>
              <td>이 도움말 열기 / 닫기</td>
            </tr>
            <tr>
              <td><kbd>↵</kbd> / <kbd>⇧↵</kbd></td>
              <td>composer 제출 / 줄바꿈</td>
            </tr>
          </tbody>
        </table>
        <div className="cmd-help-foot">
          <span>esc 닫기</span>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        className="cmd-help-trigger"
        onClick={() => setOpen(true)}
        title="명령어 도움말 (?)"
        aria-label="명령어 도움말"
      >
        ?
      </button>
      {mounted && modal ? createPortal(modal, document.body) : null}
    </>
  );
}
