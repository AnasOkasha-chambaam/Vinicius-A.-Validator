"use strict";
let url = "http://localhost:8000/api/v1/vinicius",
  iterator = 0,
  statusArray = ["stopped", "paused", "running"],
  appStatus = statusArray[0],
  updateStatus = {
    stop: () => {
      appStatus = statusArray[0];
      form_submit_btn.disabled = false;
      iterator = 0;
      pause_resume_btn.value = "Clear Textarea";
      stop_btn.style.display = "none";
    },
    pause: () => {
      appStatus = statusArray[1];
      console.log("pause");
      pause_resume_btn.value = "Resume Validation";
      stop_btn.style.display = "inline";
      return;
    },
    resume: () => {
      appStatus = statusArray[2];
      console.log("resume");
      pause_resume_btn.value = "Pause Validation";
      stop_btn.style.display = "none";
      validateFunctionality();
    },
    run: () => {
      success_data.innerHTML = false_data.innerHTML = "";
      form_submit_btn.disabled = true;
      updateStatus.resume();
    },
  },
  scriptArray;

/**
 * @desc - The function takes a String type and turn it into an Array of lines that should be validated
 * @param {String} script - The script that is going to be sent to php.
 */
function prepareScript(script) {
  return script.split(/\r?\n/); // \r for mac "Enter", \n for Window "Enter"
}

/**
 * @desc - Given an Array of lines, the function will send the line to php to validate it.
 * @param {String} scriptLine - Script Line that will be validated
 */
function lineValidator(scriptLine) {
  return fetch(url, {
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
async function validateFunctionality() {
  const startTime = Date.now();
  if (appStatus === statusArray[1]) {
    return;
  }
  if (iterator >= scriptArray.length || appStatus === statusArray[0]) {
    updateStatus.stop();
    return;
  }

  let response = await (await lineValidator(scriptArray[iterator])).json();
  const endTime = Date.now();
  response["jsExecTime"] = `${endTime - startTime} ms`;
  addResultsToItsList(response);
  iterator++;
  validateFunctionality();
}

/**
 *
 * @param {Object} serverResponse - {data: {line}, success: {bolean},serverExecTime: {number} }
 */
function addResultsToItsList({ data, success, serverExecTime }) {
  let li = document.createElement("li");
  li.innerText = data;
  document
    .getElementById(`${success ? "success" : "false"}_data`)
    .appendChild(li);
}

/**
 * @param {Object} event - The javascript event Object
 */
function scriptFormSubmit(event) {
  event.preventDefault();
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

pause_resume_btn.addEventListener("click", (event) => {
  event.preventDefault();
  if (appStatus === statusArray[0]) {
    script_list.value = "";
  }
  if (appStatus === statusArray[2]) {
    return updateStatus.pause();
  }
  if (appStatus === statusArray[1]) {
    return updateStatus.resume();
  }
});

stop_btn.addEventListener("click", (event) => {
  updateStatus.stop();
});
