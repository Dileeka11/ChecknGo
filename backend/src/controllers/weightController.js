const { PythonShell } = require("python-shell");
const path = require("path");

/**
 * Read weight from scale image using OCR
 * POST /api/weight/read
 */
const readWeight = async (req, res) => {
  try {
    const { imageData } = req.body;

    if (!imageData) {
      return res.status(400).json({
        success: false,
        error: "No image data provided",
      });
    }

    const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: "Google Cloud Vision API key not configured in .env file.",
      });
    }

    const scriptPath = path.join(__dirname, "../../ai_model");
    const scriptName = "weight_ocr.py";

    const options = {
      mode: "text",
      pythonPath: process.env.PYTHON_PATH || "python", // Allows explicit path to override default
      scriptPath: scriptPath,
    };

    const pyshell = new PythonShell(scriptName, options);

    const result = await new Promise((resolve, reject) => {
      let outputLines = [];

      pyshell.on("message", (message) => {
        outputLines.push(message);
      });

      pyshell.on("stderr", (stderr) => {
        console.log("Weight OCR stderr (ignored):", stderr);
      });

      pyshell.on("error", (err) => {
        reject(err);
      });

      pyshell.on("close", () => {
        let jsonOutput = null;
        for (let i = outputLines.length - 1; i >= 0; i--) {
          const line = outputLines[i].trim();
          if (line.startsWith("{") && line.endsWith("}")) {
            try {
              jsonOutput = JSON.parse(line);
              break;
            } catch (e) {
              // Not valid JSON, continue
            }
          }
        }

        if (jsonOutput) {
          resolve(jsonOutput);
        } else {
          reject(new Error("No valid JSON output from weight OCR script: " + outputLines.join('\n')));
        }
      });

      pyshell.send(JSON.stringify({ imageData, apiKey }));
      pyshell.end((err) => {
        if (err) reject(err);
      });
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("Weight OCR error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Weight reading failed",
    });
  }
};

module.exports = { readWeight };
