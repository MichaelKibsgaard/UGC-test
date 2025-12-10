import { VideoConfig } from '../types';
import { toPng } from 'html-to-image';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import PreviewEngine from '../components/PreviewEngine';

/**
 * Generates a video by compositing the React PreviewEngine overlay
 * on top of the background video using an off-screen Canvas.
 */
export async function generateVideo(
    config: VideoConfig,
    onProgress?: (progress: number) => void
): Promise<Blob> {
    const WIDTH = 1080;
    const HEIGHT = 1920;
    const DURATION_MS = 15000; // Generate 15 seconds or loop length (approx)
    const FPS = 30;

    // 1. Create a hidden container for the overlay render
    // We use 360x640 (9:16) as the base size, matching the PreviewEngine design.
    // We will scale it up during capture to 1080x1920 using pixelRatio: 3.
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '-9999px';
    container.style.left = '-9999px';
    container.style.width = '360px'; // Base width of PreviewEngine
    container.style.height = '640px'; // Base height of PreviewEngine
    container.style.background = 'transparent';
    document.body.appendChild(container);

    let root: Root | null = null;

    try {
        // 2. Render the PreviewEngine (Static Overlay Only) into the container
        console.log("[VideoGen] Rendering static overlay...");
        root = createRoot(container);

        // Wrap in a promise to ensure render is complete
        await new Promise<void>((resolve) => {
            if (!root) return;
            // We pass hideVideo={true} so it leaves opacity:0 holes where the video should be
            // We pass isExport={true} to remove the phone bezel
            root.render(<PreviewEngine config={config} hideVideo={true} isExport={true} />);
            // Specific timeout to allow images/fonts to load
            setTimeout(resolve, 1500);
        });

        let overlayImg: HTMLImageElement;
        console.log("[VideoGen] Capturing overlay...");
        // 3. Capture the overlay as an Image
        try {
            // pixelRatio of 3 converts 360x640 -> 1080x1920
            const dataUrl = await toPng(container, {
                width: 360,
                height: 640,
                pixelRatio: 3,
                skipAutoScale: true,
                cacheBust: true,
                skipFonts: true, // Avoid CORS errors from Google Fonts/FontAwesome
                filter: (node) => {
                    // Skip external stylesheets that might cause SecurityError
                    if (node.tagName === 'LINK' && (node as HTMLLinkElement).rel === 'stylesheet') {
                        return false;
                    }
                    return true;
                }
            });
            console.log("[VideoGen] Overlay captured, length:", dataUrl.length);

            overlayImg = new Image();
            overlayImg.src = dataUrl;
            await new Promise((resolve, reject) => {
                overlayImg.onload = resolve;
                overlayImg.onerror = (e) => { console.error("Overlay load failed", e); reject(e); };
            });
        } catch (e) {
            console.error("[VideoGen] html-to-image failed", e);
            throw e;
        }

        // 4. Setup Canvas and Video for compositing
        const canvas = document.createElement('canvas');
        canvas.width = WIDTH;
        canvas.height = HEIGHT;
        const ctx = canvas.getContext('2d');

        if (!ctx) throw new Error("Could not get canvas context");

        // Load background video
        console.log("[VideoGen] Loading background video:", config.backgroundVideoUrl);
        const bgVideo = document.createElement('video');
        bgVideo.crossOrigin = "anonymous";
        bgVideo.muted = true; // Chrome requirement for autoplay
        bgVideo.src = config.backgroundVideoUrl || "";
        bgVideo.playsInline = true; // iOS compat

        // Load overlay video if present
        let overlayVideo: HTMLVideoElement | null = null;
        if (config.overlayMediaUrl && config.overlayMediaType === 'video') {
            overlayVideo = document.createElement('video');
            overlayVideo.crossOrigin = "anonymous";
            overlayVideo.muted = true;
            overlayVideo.src = config.overlayMediaUrl;
            await new Promise((resolve, reject) => {
                if (!overlayVideo) return;
                overlayVideo.onloadeddata = resolve;
                overlayVideo.onerror = reject;
            });
        }

        if (!config.backgroundVideoUrl) {
            console.warn("[VideoGen] No background video URL provided.");
            // fallback if no background video
        } else {
            await new Promise((resolve, reject) => {
                // Use oncanplay to be sure we have frames
                bgVideo.oncanplay = () => {
                    console.log("[VideoGen] Background video can play. Dimen:", bgVideo.videoWidth, "x", bgVideo.videoHeight);
                    resolve(null);
                };
                bgVideo.onerror = (e) => {
                    console.error("[VideoGen] Video load error", e);
                    reject(e);
                };
                // Timeout fallback
                setTimeout(() => {
                    if (bgVideo.readyState >= 2) resolve(null);
                    else reject(new Error("Video load timeout"));
                }, 10000);
            });
        }

        // 5. Start Recording
        console.log("[VideoGen] Starting recording...");
        // Chrome/Firefox support 'video/webm'
        const stream = canvas.captureStream(FPS);
        const mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm;codecs=vp9'
        });

        const chunks: Blob[] = [];
        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
        };

        const recordedPromise = new Promise<Blob>((resolve) => {
            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                resolve(blob);
            };
        });

        mediaRecorder.start();
        if (config.backgroundVideoUrl) {
            bgVideo.play().catch(e => console.error("bgVideo play failed", e));
        }
        if (overlayVideo) {
            overlayVideo.play().catch(e => console.error("overlayVideo play failed", e));
        }

        // 6. Animation Loop
        let startTime = performance.now();
        // Use loop if video is short? 
        // For now simple fixed duration

        return new Promise((resolve) => {

            async function renderLoop(now: number) {
                const elapsed = now - startTime;

                // Progress update
                if (onProgress) {
                    onProgress(Math.min((elapsed / DURATION_MS) * 100, 99));
                }

                if (elapsed >= DURATION_MS) {
                    mediaRecorder.stop();
                    const blob = await recordedPromise;
                    resolve(blob);
                    return;
                }

                // Draw Background Video OR Fallback
                if (config.backgroundVideoUrl) {
                    // Determine aspect ratio scaling like 'object-cover' (center crop)
                    // Source
                    const vw = bgVideo.videoWidth;
                    const vh = bgVideo.videoHeight;
                    // Protect against 0 dims
                    if (vw > 0 && vh > 0) {
                        const videoRatio = vw / vh;
                        const targetRatio = WIDTH / HEIGHT;

                        let drawW, drawH, startX, startY;

                        if (videoRatio > targetRatio) {
                            // Video is wider than target -> crop sides
                            drawH = HEIGHT;
                            drawW = HEIGHT * videoRatio;
                            startY = 0;
                            startX = (WIDTH - drawW) / 2;
                        } else {
                            // Video is taller or equal -> crop top/bottom
                            drawW = WIDTH;
                            drawH = WIDTH / videoRatio;
                            startX = 0;
                            startY = (HEIGHT - drawH) / 2;
                        }

                        ctx!.drawImage(bgVideo, startX, startY, drawW, drawH);
                    }
                } else {
                    // Fallback Gradient "NO SIGNAL"
                    const grad = ctx!.createLinearGradient(0, 0, WIDTH, HEIGHT);
                    grad.addColorStop(0, '#312e81'); // indigo-900
                    grad.addColorStop(1, '#581c87'); // purple-900
                    ctx!.fillStyle = grad;
                    ctx!.fillRect(0, 0, WIDTH, HEIGHT);

                    // Draw "NO SIGNAL" text
                    ctx!.save();
                    ctx!.fillStyle = 'rgba(255,255,255,0.2)';
                    ctx!.font = 'bold 60px Arial';
                    ctx!.textAlign = 'center';
                    ctx!.textBaseline = 'middle';
                    ctx!.fillText('NO SIGNAL', WIDTH / 2, HEIGHT / 2);
                    ctx!.restore();
                }

                // Draw Overlay Image (Static UI)
                // Ensure we draw it effectively
                if (overlayImg) {
                    ctx!.drawImage(overlayImg, 0, 0);
                }

                // Draw Overlay Video
                // We need to approximate where it is.
                // In PreviewEngine, the overlay card is centered. 
                // The content media slot is roughly in the middle.
                // For MVP, we will assume the user uses IMAGE overlays or we skip the video-in-video for the download unless we calculate position.
                // (If complex position calculation is needed, we would do it by capturing bounding client rect of the empty slot div)

                requestAnimationFrame(renderLoop);
            }

            requestAnimationFrame(renderLoop);
        });

    } finally {
        // Cleanup
        if (root) {
            // Unmount needs to happen asynchronously sometimes or just standard
            setTimeout(() => root?.unmount(), 0);
        }
        if (document.body.contains(container)) {
            document.body.removeChild(container);
        }
    }
}
