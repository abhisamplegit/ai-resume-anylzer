export interface PdfConversionResult {
    imageUrl: string;
    file: File | null;
    error?: string;
}

let pdfjsLib: any = null;
let isLoading = false;
let loadPromise: Promise<any> | null = null;

async function loadPdfJs(): Promise<any> {
    if (pdfjsLib) return pdfjsLib;
    if (loadPromise) return loadPromise;

    isLoading = true;
    // @ts-expect-error - pdfjs-dist/build/pdf.mjs is not a module
    loadPromise = import("pdfjs-dist/build/pdf.mjs").then((lib) => {
        // Set the worker source to use local file
        lib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        pdfjsLib = lib;
        isLoading = false;
        return lib;
    });

    return loadPromise;
}

export async function convertPdfToImage(
    file: File
): Promise<PdfConversionResult> {
    try {
        console.log("🟢 convertPdfToImage called with file:", file?.name);

        if (typeof window === "undefined") {
            console.error("❌ Running in SSR (no window), cannot use canvas/pdfjs here");
            return {
                imageUrl: "",
                file: null,
                error: "PDF conversion can only run in the browser",
            };
        }

        console.log("📥 Loading pdfjs...");
        const lib = await loadPdfJs();
        console.log("✅ pdfjs loaded:", lib);

        const arrayBuffer = await file.arrayBuffer();
        console.log("📄 Got ArrayBuffer from file, size:", arrayBuffer.byteLength);

        if (file.type !== "application/pdf") {
            throw new Error("Invalid file type. Expected a PDF.");
        }

        console.log("File type:", file.type, "Size:", file.size);

        const pdf = await lib.getDocument({ data: arrayBuffer }).promise;
        console.log("✅ PDF loaded, number of pages:", pdf.numPages);

        const page = await pdf.getPage(1);
        console.log("📄 Got page 1");

        const viewport = page.getViewport({ scale: 4 });
        console.log("📐 Viewport created:", viewport);

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        console.log("🖼️ Canvas + context created:", { width: viewport.width, height: viewport.height, context });

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        if (context) {
            context.imageSmoothingEnabled = true;
            context.imageSmoothingQuality = "high";
        }

        console.log("🎨 Starting page render...");
        await page.render({ canvasContext: context!, viewport, canvas }).promise;
        console.log("✅ Page rendered to canvas");

        return new Promise((resolve) => {
            console.log("💾 Converting canvas to blob...");
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        const originalName = file.name.replace(/\.pdf$/i, "");
                        const imageFile = new File([blob], `${originalName}.png`, {
                            type: "image/png",
                        });
                        console.log("✅ Blob created, size:", blob.size);

                        resolve({
                            imageUrl: URL.createObjectURL(blob),
                            file: imageFile,
                        });
                    } else {
                        console.error("❌ Failed to create blob from canvas");
                        resolve({
                            imageUrl: "",
                            file: null,
                            error: "Failed to create image blob",
                        });
                    }
                },
                "image/png",
                1.0
            );
        });
    } catch (err) {
        console.error("🔥 ERROR in convertPdfToImage:", err);
        return {
            imageUrl: "",
            file: null,
            error: `Failed to convert PDF: ${err}`,
        };
    }
}

