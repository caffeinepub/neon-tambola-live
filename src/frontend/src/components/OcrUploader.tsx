import { Button } from "@/components/ui/button";
import { Loader2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { ocrExtractNumbers, parseOcrIntoTickets } from "../utils/ocr";
import type { OcrProgress } from "../utils/ocr";
import { isValidTicket } from "../utils/ticketGenerator";

interface Props {
  onTicketsExtracted: (grids: (number | null)[][][]) => void;
}

export default function OcrUploader({ onTicketsExtracted }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<OcrProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [extractedNums, setExtractedNums] = useState<number[]>([]);
  const [parsedGrids, setParsedGrids] = useState<(number | null)[][][]>([]);
  const [done, setDone] = useState(false);

  const handleFile = async (file: File) => {
    setError(null);
    setDone(false);
    setExtractedNums([]);
    setParsedGrids([]);

    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setProgress({ status: "Starting OCR...", progress: 0 });
    try {
      const nums = await ocrExtractNumbers(file, (p) => setProgress(p));
      setExtractedNums(nums);
      const { grids } = parseOcrIntoTickets(nums);
      const validGrids = grids.filter((g) => isValidTicket(g));
      setParsedGrids(validGrids);
      setProgress(null);
      setDone(true);
      if (validGrids.length === 0) {
        setError(
          `OCR found ${nums.length} numbers but could not form valid tickets. Please add tickets manually.`,
        );
      }
    } catch (e: any) {
      setProgress(null);
      setError(
        e?.message ?? "OCR failed. Please try again or add tickets manually.",
      );
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleAdd = () => {
    if (parsedGrids.length > 0) {
      onTicketsExtracted(parsedGrids);
      setDone(false);
      setPreview(null);
      setExtractedNums([]);
      setParsedGrids([]);
    }
  };

  return (
    <div className="space-y-3">
      {/* Dropzone — use button role for a11y */}
      <button
        type="button"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        className="w-full border-2 border-dashed border-primary/30 hover:border-primary/60 rounded-xl p-6 text-center cursor-pointer transition-all group"
        data-ocid="ocr.dropzone"
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={handleInputChange}
        />
        {preview ? (
          <img
            src={preview}
            alt="Uploaded ticket"
            className="max-h-40 mx-auto rounded-lg object-contain mb-2"
          />
        ) : (
          <Upload className="w-8 h-8 mx-auto mb-2 text-primary/50 group-hover:text-primary transition-colors" />
        )}
        <p className="text-sm text-muted-foreground">
          {preview
            ? "Click to upload another image"
            : "Drop ticket photo or PDF here, or click to browse"}
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          JPG, PNG, PDF accepted
        </p>
      </button>

      {progress && (
        <div className="glass rounded-lg p-3" data-ocid="ocr.loading_state">
          <div className="flex items-center gap-2 mb-2">
            <Loader2 className="w-4 h-4 animate-spin text-accent" />
            <span className="text-xs text-muted-foreground font-mono">
              {progress.status}
            </span>
            <span className="ml-auto text-xs font-mono text-accent">
              {progress.progress}%
            </span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-300 rounded-full"
              style={{ width: `${progress.progress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div
          className="glass rounded-lg p-3 border-destructive/30"
          data-ocid="ocr.error_state"
        >
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      {done && parsedGrids.length > 0 && (
        <div
          className="glass rounded-lg p-3 border-success/20"
          data-ocid="ocr.success_state"
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs text-success font-mono font-bold">
                ✓ Found {parsedGrids.length} valid ticket
                {parsedGrids.length !== 1 ? "s" : ""}
              </p>
              <p className="text-xs text-muted-foreground">
                {extractedNums.length} numbers extracted from image
              </p>
            </div>
            <Button
              size="sm"
              onClick={handleAdd}
              className="bg-success/20 text-success border border-success/30 hover:bg-success/30 text-xs"
              data-ocid="ocr.submit_button"
            >
              Add {parsedGrids.length} Ticket
              {parsedGrids.length !== 1 ? "s" : ""}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
