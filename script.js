"use strict";
let url = "http://localhost:8000/api/v1/vinicius", // Put URL here
  iterator = 0,
  statusArray = ["stopped", "paused", "running"],
  appStatus = statusArray[0],
  execStartTime = 0,
  execEndTime = 0,
  operationsCompleteted = 0,
  updateStatus = {
    stop: () => {
      console.log("stop");
      execEndTime = Date.now();
      appStatus = statusArray[0];
      form_submit_btn.disabled = false;
      iterator = 0;
      pause_resume_btn.value = "Clear Textarea";
      pause_resume_btn.className = "clear";
      stop_btn.style.display = "none";
      updateStatus.updateUI(true);
    },
    // pause: () => {
    //   appStatus = statusArray[1];
    //   console.log("pause");
    //   pause_resume_btn.value = "Resume Validation";
    //   pause_resume_btn.className = "resume";
    //   stop_btn.style.display = "inline";
    //   return;
    // },
    cancel: () => {
      console.log("cancel");
      updateStatus.lastController.abort();
      updateStatus.stop();
    },
    resume: () => {
      appStatus = statusArray[2];
      console.log("resume");
      pause_resume_btn.value = "Cancel Validation";
      pause_resume_btn.className = "pause";
      stop_btn.style.display = "none";
      scriptArray.forEach((line, index) => {
        if (appStatus === statusArray[2]) {
          validateFunctionality(index);
          iterator++;
        }
      });
    },
    run: () => {
      operationsCompleteted = 0;
      execStartTime = Date.now();
      if (updateStatus.lastController !== 0 || updateStatus.lastSignal !== 0) {
        updateStatus.lastController.abort();
      }
      updateStatus.lastController = new AbortController();
      updateStatus.lastSignal = updateStatus.lastController.signal;
      totalJSTime = totalServerTime = 0;
      falseCounter = successCounter = 0;
      success_data.innerHTML = false_data.innerHTML = "";
      form_submit_btn.disabled = true;
      net_time.innerHTML = "";
      validate_counters.innerHTML = "";
      false_counter.innerText = success_counter.innerText = 0;
      updateStatus.resume();
    },
    updateUI: (showTime) => {
      if (showTime) {
        net_time.innerHTML = `Total JS Execution Time: <span>${
          execEndTime - execStartTime
        } ms</span> & Total Server Execution Time: <span>${totalServerTime} ms</span>.`;
      }
      validate_counters.innerHTML = `Total Validated Lines: <span>${
        successCounter + falseCounter
      } Line</span> & Total Unvalidated Lines: <span>${
        -successCounter - falseCounter + scriptArray.length
      } Line</span>.`;
    },
    lastController: 0,
    lastSignal: 0,
  },
  scriptArray,
  totalJSTime = 0,
  totalServerTime = 0,
  successCounter = 0,
  falseCounter = 0;

/**
 * @desc - The function takes a String type and turn it into an Array of lines that should be validated
 * @param {String} script - The script that is going to be sent to php.
 */
function prepareScript(script) {
  return script.split(/\r?\n/);
}

/**
 * @desc - Given an Array of lines, the function will send the line to php to validate it.
 * @param {String} scriptLine - Script Line that will be validated
 */
function lineValidator(scriptLine) {
  return fetch(url, {
    signal: updateStatus.lastSignal,
    method: "POST",
    body: scriptLine.trim(),
    headers: { "Content-Type": "text/plain" },
  });

  //   return await fetch(url, {
  //     method: "POST",
  //     body: scriptLine,
  //   });
}

/**
 *
 * @param {Array} scriptArray - Array of lines to be validated
 * @returns iterator = 0  - Reseting the iterator to zero
 */
async function validateFunctionality(index) {
  const startTime = Date.now();

  if (appStatus === statusArray[1]) {
    return;
  }
  if (iterator >= scriptArray.length || appStatus === statusArray[0]) {
    // updateStatus.stop();
    // updateStatus.updateUI();
    return;
  }
  try {
    let response = await (await lineValidator(scriptArray[iterator])).json();
    const endTime = Date.now();
    response["jsExecTime"] = endTime - startTime;
    totalJSTime += response["jsExecTime"];
    totalServerTime += response["execTime"];
    addResultsToItsList(response, index);
    updateStatus.updateUI();
    operationsCompleteted++;
    if (operationsCompleteted === scriptArray.length) {
      updateStatus.stop();
      // updateStatus.updateUI();
    }
  } catch (err) {
    updateStatus.stop();
    console.log(err.message);
  }
}

/**
 *
 * @param {Object} serverResponse - {data: {line}, success: {bolean},serverExecTime: {number} }
 */
function addResultsToItsList({ data, success, execTime, jsExecTime }, index) {
  let li = document.createElement("li"),
    span = document.createElement("span");
  span.innerHTML = `JS Execution Time: <span>${jsExecTime} ms</span> & Server ExecTime: <span>${execTime} ms</span>`;
  span.className = "extra-info";
  li.innerText = data;
  li.appendChild(span);
  document
    .getElementById(`${success ? "success" : "false"}_data`)
    .appendChild(li);
  document
    .querySelector(`.line-numbers span:nth-child(${index + 1})`)
    .classList.add(success ? "success" : "false");
  success ? successCounter++ : falseCounter++;
  success_counter.innerText = successCounter;
  false_counter.innerHTML = falseCounter;
}

/**
 * @param {Object} event - The javascript event Object
 */
function scriptFormSubmit(event) {
  event.preventDefault();
  addLinesToTextarea();
  let scriptListInputValue = script_list.value.trim();

  if (!(scriptListInputValue.length > 0)) {
    form_submit_btn.disabled = false;
    return alert("Please, Enter a valid value");
  }

  scriptArray = prepareScript(scriptListInputValue);
  appStatus = statusArray[2];
  updateStatus.run();
}

script_to_validate.addEventListener("submit", scriptFormSubmit);

/**
 * @desc - Pause/Resume functionality & Clear Editor
 */
pause_resume_btn.addEventListener("click", (event) => {
  event.preventDefault();
  if (appStatus === statusArray[0]) {
    script_list.value = "";
    addLinesToTextarea();
  }
  if (appStatus === statusArray[2]) {
    return updateStatus.cancel();
  }
  if (appStatus === statusArray[1]) {
    return updateStatus.resume();
  }
});

/**
 * @desc - Stop functioality
 */
stop_btn.addEventListener("click", (event) => {
  updateStatus.stop();
});

function addLinesToTextarea() {
  const numberOfLines = script_list.value.split(/\r?\n/).length;
  line_numbers.innerHTML = Array(numberOfLines).fill("<span></span>").join("");
}
script_list.addEventListener("keypress", addLinesToTextarea);
