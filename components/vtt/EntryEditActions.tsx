"use client";

import { useState, useTransition } from "react";
import { deletePlayEntryAction, updatePlayEntryAction } from "@/app/actions";

type Kind = "narration" | "dialogue" | "system";

export function EntryEditActions({
  entryId,
  initialTitle,
  initialKind,
  isKeeper,
}: {
  entryId: number;
  initialTitle: string;
  initialKind: Kind;
  isKeeper: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [kind, setKind] = useState<Kind>(initialKind);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const save = () => {
    if (!title.trim()) {
      setError("제목을 입력하세요");
      return;
    }
    setError(null);
    const fd = new FormData();
    fd.set("entry_id", String(entryId));
    fd.set("title", title.trim());
    fd.set("kind", kind);
    start(async () => {
      try {
        await updatePlayEntryAction(fd);
        setEditing(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "저장 실패");
      }
    });
  };

  const cancel = () => {
    setTitle(initialTitle);
    setKind(initialKind);
    setError(null);
    setEditing(false);
  };

  const onDelete = () => {
    if (!confirm(`이 글을 삭제할까요?\n\n"${initialTitle}"\n\n되돌릴 수 없습니다.`)) return;
    const fd = new FormData();
    fd.set("entry_id", String(entryId));
    start(async () => {
      try {
        await deletePlayEntryAction(fd);
      } catch (e) {
        setError(e instanceof Error ? e.message : "삭제 실패");
      }
    });
  };

  if (!editing) {
    return (
      <div className="ed-edit-actions">
        <button
          type="button"
          className="btn ghost"
          onClick={() => setEditing(true)}
        >
          ✎ 편집
        </button>
        <button
          type="button"
          className="btn ghost danger"
          onClick={onDelete}
          disabled={pending}
        >
          삭제
        </button>
        {error ? <span className="ed-edit-error">{error}</span> : null}
      </div>
    );
  }

  return (
    <div className="ed-edit-form">
      <div className="ed-edit-row">
        <span className="ed-edit-label">종류</span>
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as Kind)}
          disabled={pending}
          className="ed-edit-kind"
        >
          <option value="dialogue">발화</option>
          <option value="narration">내레이션</option>
          {isKeeper ? <option value="system">시스템</option> : null}
        </select>
      </div>
      <div className="ed-edit-row">
        <span className="ed-edit-label">제목</span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          autoFocus
          disabled={pending}
          className="ed-edit-title"
        />
      </div>
      <p className="ed-edit-note">
        본문 내용은 수정할 수 없습니다 (다이스 굴림 결과 보존). 제목·종류만 변경 가능.
      </p>
      {error ? <div className="ed-edit-error">{error}</div> : null}
      <div className="ed-edit-actions">
        <button
          type="button"
          className="btn primary"
          onClick={save}
          disabled={pending || !title.trim()}
        >
          {pending ? "저장…" : "저장"}
        </button>
        <button
          type="button"
          className="btn ghost"
          onClick={cancel}
          disabled={pending}
        >
          취소
        </button>
      </div>
    </div>
  );
}
