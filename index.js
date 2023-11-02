const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");

//inits
const app = express();
const port = process.env["PORT"] ? process.env["PORT"] : 80;
const ext_port = process.env["EXT_PORT"] ? process.env["EXT_PORT"] : 80;
const options = {
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "X-Access-Token",
  ],
  credentials: true,
  methods: "GET,HEAD,OPTIONS,PUT,PATCH,POST,DELETE",
  origin: "*",
  preflightContinue: false,
};
app.use(cors(options));
app.use(bodyParser.json());

//build function object
let functions = {};
fs.readdir("./functions", function (err, filenames) {
  if (err) {
    console.log(err);
    process.exit(1);
  }
  filenames.forEach(function (filename) {
    let funcfile = require("./functions/" + filename);
    for (const f of Object.keys(funcfile)) {
      if (functions[f] == undefined) {
        functions[f] = funcfile[f];
      }
    }
  });
  console.log("functions parsed!");
});

//setup workflow endpoints
let workflows = {};
fs.readdir("./workflows", function (err, filenames) {
  if (err) {
    console.log(err);
    process.exit(1);
  }
  filenames.forEach(function (filename) {
    fs.readFile("./workflows/" + filename, "utf-8", function (err, content) {
      if (err) {
        console.log(err);
        process.exit(1);
      }
      workflows[filename.replace(".json", "")] = JSON.parse(content);
    });
    app.post(
      "/connection/" + filename.replace(".json", ""),
      async function (req, res) {
        try {
          res.header("Access-Control-Allow-Origin", "*");
          res.header("Access-Control-Allow-Headers", "*");
          res.send({
            data: await evaluateWorkflow(
              filename.replace(".json", ""),
              req.body.data
            ),
          });
        } catch (e) {
          console.log(e);
          res.send({ exception: e });
        }
      }
    );
    console.log(
      "/connection/" + filename.replace(".json", "") + " Endpoint Ready!"
    );
  });
  console.log("Workflow endpoints ready!");
});

async function evaluateWorkflow(w, data) {
  let workflow = workflows[w];
  let currentStep = workflow.workflow.find((r) => r.label == "INIT");
  let returnLabel = "INIT";
  do {
    console.log(currentStep);
    result = await functions[currentStep.function](data);
    returnLabel = currentStep.returns[result.result];
    data = result.data;
    currentStep = workflow.workflow.find((r) => r.label == returnLabel);
  } while (returnLabel != "END");
  return data;
}

app.listen(3000);
