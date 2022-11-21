"use strict";
class HyperdizedWay {
  constructor(maxRequestsNumber, arr) {
    this.iteratorValue = 0;
    this.maxRequestsNumber = maxRequestsNumber;
    this.arr = arr;
  }
  get iterator() {
    return this.iteratorValue;
  }
  set iterator(value) {
    if (value > this.arr.length) return;
    this.iteratorValue = value;
    iterator = value;
    let promise = new Promise(async (res, rej, reason) => {
      await validateFunctionality(this.iteratorValue - 1);
      res();
    });
    promise.then(() => {
      this.iterator = this.iterator + 1;
      //   console.log(this.iteratorValue);
    });
  }
}
let emptyPlaces = 500;
let url = "http://localhost:8000/api/v1/vinicius", // Put URL here
  iterator = 0,
  statusArray = ["stopped", "paused", "running"],
  appStatus = statusArray[0],
  execStartTime = 0,
  execEndTime = 0,
  operationsCompleteted = 0,
  updateStatus = {
    run: () => {
      form_submit_btn.disabled = true;
      updateStatus.resetUI();
      updateStatus.resetVariables();
      execStartTime = Date.now();
      updateStatus.resetFetchController();
      updateStatus.resume();
    },
    resume: () => {
      updateStatus.changeAppStatus(statusArray[2], "Resume");
      let i = new HyperdizedWay(
        scriptArray.length < emptyPlaces ? scriptArray.length : emptyPlaces,
        scriptArray
      );
      for (i.iterator; i.iterator < i.maxRequestsNumber; ) {
        i.iterator = i.iterator + 1;
      }
      // scriptArray.forEach((line, index) => {
      //   if (appStatus === statusArray[2]) {
      //     validateFunctionality(index);
      //     iterator++;
      //   }
      // });
    },
    cancel: () => {
      updateStatus.lastController.abort();
      console.log("cancel");
      updateStatus.stop();
    },
    stop: () => {
      updateStatus.changeAppStatus(statusArray[0], "Stop");
      execEndTime = Date.now();
      updateStatus.updateUI(true);
    },
    // pause: () => {
    // updateStatus.changeAppStatus(statusArray[1],'Pause')
    //   return;
    // },

    resetVariables: () => {
      iterator = 0;
      operationsCompleteted = 0;
      totalJSTime = totalServerTime = 0;
      falseCounter = successCounter = 0;
    },
    resetFetchController: () => {
      if (updateStatus.lastController !== 0 || updateStatus.lastSignal !== 0) {
        updateStatus.lastController.abort();
      }
      updateStatus.lastController = new AbortController();
      updateStatus.lastSignal = updateStatus.lastController.signal;
    },
    resetUI: () => {
      net_time.innerHTML = "";
      validate_counters.innerHTML = "";
      success_data.innerHTML = false_data.innerHTML = "";
      false_counter.innerText = success_counter.innerText = 0;
    },
    changeAppStatus: (appNewStatus, consoleLog) => {
      appStatus = appNewStatus;
      console.log(consoleLog);
      updateStatus.update_btns(appStatus);
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
    update_btns(status) {
      switch (status) {
        case statusArray[0]: // Stop
          pause_resume_btn.value = "Clear Textarea";
          pause_resume_btn.className = "clear";
          stop_btn.style.display = "none";
          form_submit_btn.disabled = false;
          break;
        case statusArray[1]: // Pause
          pause_resume_btn.value = "Resume Validation";
          pause_resume_btn.className = "resume";
          stop_btn.style.display = "inline";
          break;
        case statusArray[2]: // Run
          pause_resume_btn.value = "Cancel Validation";
          pause_resume_btn.className = "pause";
          stop_btn.style.display = "none";
          break;
        default:
          console.log(appStatus);
          break;
      }
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
  if (index >= scriptArray.length || appStatus === statusArray[0]) {
    // updateStatus.stop();
    // updateStatus.updateUI();
    return;
  }
  try {
    let response = await (await lineValidator(scriptArray[index])).json();
    // Set Execution Time
    const endTime = Date.now();
    response["jsExecTime"] = endTime - startTime;
    totalJSTime += response["jsExecTime"];
    totalServerTime += response["execTime"];
    // Handle Results
    addResultsToItsList(response, index);
    updateStatus.updateUI();
    operationsCompleteted++;
    if (operationsCompleteted === scriptArray.length) {
      updateStatus.stop();
    }
  } catch (err) {
    updateStatus.stop();
    console.log(err.message);
  }
}

/**
 * @desc - Handle Results
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
