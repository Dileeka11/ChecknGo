const { PythonShell } = require("python-shell");
const path = require("path");

/**
 * Predict fruit/vegetable from image
 * POST /api/predict
 */
const predictFruit = async (req, res) => {
  try {
    const { imageData } = req.body;

    if (!imageData) {
      return res.status(400).json({
        success: false,
        error: "No image data provided",
      });
    }

    // Path to Python script
    const scriptPath = path.join(__dirname, "../../ai_model");
    const scriptName = "predict.py";

    // Configure python-shell - use text mode to handle any TensorFlow warnings
    const options = {
      mode: "text",
      pythonPath: "python", // Uses system Python
      scriptPath: scriptPath,
    };

    // Create a new PythonShell instance
    const pyshell = new PythonShell(scriptName, options);

    // Promise wrapper for python-shell
    const result = await new Promise((resolve, reject) => {
      let outputLines = [];

      pyshell.on("message", (message) => {
        outputLines.push(message);
      });

      pyshell.on("stderr", (stderr) => {
        // Ignore stderr (TensorFlow warnings)
        console.log("Python stderr (ignored):", stderr);
      });

      pyshell.on("error", (err) => {
        reject(err);
      });

      pyshell.on("close", () => {
        // Find the last line that looks like JSON
        let jsonOutput = null;
        for (let i = outputLines.length - 1; i >= 0; i--) {
          const line = outputLines[i].trim();
          if (line.startsWith('{') && line.endsWith('}')) {
            try {
              jsonOutput = JSON.parse(line);
              break;
            } catch (e) {
              // Not valid JSON, continue searching
            }
          }
        }
        
        if (jsonOutput) {
          resolve(jsonOutput);
        } else {
          reject(new Error("No valid JSON output from Python script. Output: " + outputLines.join('\n')));
        }
      });

      // Send image data to Python script
      pyshell.send(JSON.stringify({ imageData }));
      pyshell.end((err) => {
        if (err) reject(err);
      });
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error("Prediction error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Prediction failed",
    });
  }
};

module.exports = {
  predictFruit,
};
