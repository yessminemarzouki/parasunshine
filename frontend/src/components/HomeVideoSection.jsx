import InlineVideoPlayer from "./InlineVideoPlayer";
import { STORAGE_URL } from "../config/api";

export default function HomeVideoSection({ video }) {
  if (!video) return null;

  return (
    <section className="py-14 bg-white">
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px" }}>
        {video.title && (
          <h2
            className="text-center text-[1.4rem] md:text-[1.6rem] font-bold text-gray-900 mb-6"
            style={{
              fontFamily: "Segoe UI, sans-serif",
              letterSpacing: "-0.02em",
            }}
          >
            {video.title}
          </h2>
        )}
        <InlineVideoPlayer
          src={`${STORAGE_URL}/${video.video}`}
          poster={video.poster ? `${STORAGE_URL}/${video.poster}` : undefined}
        />
      </div>
    </section>
  );
}
