import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Share2, ThumbsDown, ThumbsUp, Trash2 } from "lucide-react";
import type { VideoDetail } from "@/types";
import { formatCount } from "@/lib/format";
import {
  copyExistingVideoShareURL,
  createAndCopyVideoShare,
} from "@/lib/videoShareClipboard";

type Props = {
  video: VideoDetail;
  onDeleteVideo: () => void;
  deleteSaving?: boolean;
  canDelete?: boolean;
};

/**
 * 视频操作工具条。
 * - 整体是一张浮起的圆角玻璃卡，比上一版的横线分隔更"成体"。
 * - 点赞 + 点踩是两个独立按钮。
 * - 删除是唯一的管理操作，hover 时露出 danger 色。
 *
 * 功能没变：
 * - 后端只有点赞计数接口，点踩仅本地 state。
 * - 失败回滚已经处理。
 */
export function VideoActions({
  video,
  onDeleteVideo,
  deleteSaving,
  canDelete = true,
}: Props) {
  const [likes, setLikes] = useState(video.likes ?? 0);
  const [dislikes, setDislikes] = useState(video.dislikes ?? 0);
  const [bursting, setBursting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [likeSubmitted, setLikeSubmitted] = useState(false);
  const [shareState, setShareState] = useState<
    "idle" | "creating" | "copy-ready" | "copied" | "error"
  >("idle");
  const shareResetTimer = useRef<number | null>(null);
  const pendingShareURL = useRef("");

  useEffect(() => {
    setLikes(video.likes ?? 0);
    setDislikes(video.dislikes ?? 0);
    setBursting(false);
    setLiked(false);
    setDisliked(false);
    setLikeSubmitted(false);
    setShareState("idle");
    pendingShareURL.current = "";
    if (shareResetTimer.current !== null) {
      window.clearTimeout(shareResetTimer.current);
      shareResetTimer.current = null;
    }
  }, [video.id, video.likes, video.dislikes]);

  useEffect(() => {
    return () => {
      if (shareResetTimer.current !== null) {
        window.clearTimeout(shareResetTimer.current);
      }
    };
  }, []);

  async function handleLike() {
    if (liked) return;
    setLiked(true);
    setBursting(true);
    window.setTimeout(() => setBursting(false), 320);

    if (disliked) {
      setDisliked(false);
      setDislikes((n) => Math.max(0, n - 1));
    }

    if (likeSubmitted) return;

    setLikeSubmitted(true);
    setLikes((n) => n + 1);

    try {
      const res = await fetch(
        `/api/video/${encodeURIComponent(video.id)}/like`,
        { method: "POST", credentials: "include" }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { likes: number };
      if (typeof data.likes === "number") {
        setLikes(data.likes);
      }
    } catch {
      setLikes((n) => Math.max(0, n - 1));
      setLiked(false);
      setLikeSubmitted(false);
    }
  }

  function handleDislike() {
    if (disliked) {
      setDisliked(false);
      setDislikes((n) => Math.max(0, n - 1));
      return;
    }
    setDisliked(true);
    setDislikes((n) => n + 1);
    if (liked) {
      setLiked(false);
    }
  }

  async function handleShare() {
    if (shareState === "creating") return;
    setShareState("creating");
    try {
      if (pendingShareURL.current) {
        await copyExistingVideoShareURL(pendingShareURL.current);
      } else {
        const result = await createAndCopyVideoShare(video.id);
        if (!result.copied) {
          pendingShareURL.current = result.url;
          setShareState("copy-ready");
          scheduleShareStateReset(2500);
          return;
        }
      }
      pendingShareURL.current = "";
      setShareState("copied");
      scheduleShareStateReset(1500);
    } catch {
      setShareState("error");
    }
  }

  function scheduleShareStateReset(delay: number) {
    if (shareResetTimer.current !== null) {
      window.clearTimeout(shareResetTimer.current);
    }
    shareResetTimer.current = window.setTimeout(() => {
      setShareState("idle");
      shareResetTimer.current = null;
    }, delay);
  }

  return (
    <>
      <div className="vd-actions" role="toolbar" aria-label="视频操作">
        <div className="vd-actions__group" role="group" aria-label="点赞和点踩">
          <button
            type="button"
            className={`vd-actions__pill vd-actions__like${
              liked ? " is-active" : ""
            }${bursting ? " is-bursting" : ""}`}
            onClick={handleLike}
            aria-pressed={liked}
            aria-label="点赞"
          >
            <ThumbsUp size={18} fill={liked ? "currentColor" : "none"} />
            <span className="vd-actions__count">{formatCount(likes)}</span>
          </button>
          <button
            type="button"
            className={`vd-actions__pill vd-actions__dislike${
              disliked ? " is-active" : ""
            }`}
            onClick={handleDislike}
            aria-pressed={disliked}
            aria-label="点踩"
          >
            <ThumbsDown size={18} fill={disliked ? "currentColor" : "none"} />
            <span className="vd-actions__count">{formatCount(dislikes)}</span>
          </button>
        </div>

        <button
          type="button"
          className={`vd-actions__btn vd-actions__share${
            shareState === "copied" ? " is-success" : ""
          }`}
          onClick={handleShare}
          disabled={shareState === "creating"}
          aria-label={
            pendingShareURL.current
              ? "复制已生成的一次性分享链接"
              : "生成并复制一次性分享链接"
          }
        >
          {shareState === "copied" ? <Check size={16} /> : <Share2 size={16} />}
          <span>
            {shareState === "creating"
              ? "生成中"
              : shareState === "copied"
                ? "链接已复制"
                : shareState === "copy-ready"
                  ? "再次点击复制"
                  : shareState === "error"
                    ? pendingShareURL.current
                      ? "复制失败，重试"
                      : "分享失败，重试"
                    : "分享"}
          </span>
        </button>

        {canDelete && (
          <button
            type="button"
            className="vd-actions__btn vd-actions__delete"
            onClick={onDeleteVideo}
            disabled={deleteSaving}
            aria-label="删除这个视频"
          >
            <Trash2 size={16} />
            <span>{deleteSaving ? "删除中" : "删除"}</span>
          </button>
        )}
      </div>

      {(shareState === "copied" || shareState === "copy-ready") &&
        createPortal(
          <div
            className="vd-share-toast"
            role="status"
            aria-live="polite"
          >
            <span>
              {shareState === "copied"
                ? "已复制一次性分享链接"
                : "请再次点击分享按钮"}
            </span>
          </div>,
          document.body
        )}
    </>
  );
}
