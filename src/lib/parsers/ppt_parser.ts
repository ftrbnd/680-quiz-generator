import { exec } from "child_process";
import { writeFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

function execShellCommand(command: string): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    exec(command, (err, stdout, stderr) => {
      if (err) reject(err);
      else resolve({ stdout: stdout?.toString() ?? "", stderr: stderr?.toString() ?? "" });
    });
  });
}

export class PptParseError extends Error {
  readonly code = "PPT_PARSE_FAILED";
}

export async function parsePpt({ buffer, filename }: { buffer: Buffer; filename: string }): Promise<string> {
  const tmpPath = join(tmpdir(), `ppt_${Date.now()}_${filename}`);
  try {
    await writeFile(tmpPath, buffer);
    // Use LibreOffice to convert to text if available, otherwise fall back to basic XML extraction
    const { stdout } = await execShellCommand(
      `python3 -c "
import zipfile, re, sys
try:
    with zipfile.ZipFile('${tmpPath}') as z:
        text = []
        for name in z.namelist():
            if re.match(r'ppt/slides/slide[0-9]+\\.xml', name):
                xml = z.read(name).decode('utf-8', errors='ignore')
                words = re.findall(r'<a:t>(.*?)</a:t>', xml)
                text.extend(words)
        print(' '.join(text))
except Exception as e:
    print('', file=sys.stderr)
    sys.exit(1)
"`
    );
    return stdout.trim();
  } catch (err) {
    throw new PptParseError(
      `Failed to extract text from PPT/PPTX: ${err instanceof Error ? err.message : String(err)}`
    );
  } finally {
    await unlink(tmpPath).catch(() => {});
  }
}
