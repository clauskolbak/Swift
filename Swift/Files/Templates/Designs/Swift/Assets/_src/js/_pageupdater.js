const PageUpdater = function () {

	return {
		Update: async function (e) {
			var clickedButton = e.currentTarget != undefined ? e.currentTarget : e;
			var form = clickedButton.closest("form");
			var preloader = form.getAttribute("data-preloader");
			var responseTargetElement = form.getAttribute("data-response-target-element") ? "#" + form.getAttribute("data-response-target-element") : "#content";
			responseTargetElement = document.querySelector(responseTargetElement);
			var layoutTemplate = form.getAttribute("data-layout-template") ? form.getAttribute("data-layout-template") : "Swift_PageClean.cshtml";

			let formData = new FormData(form);
			formData.set("LayoutTemplate", layoutTemplate);
			var fetchOptions = {
				method: 'POST',
				body: formData
			};

			//Fire the 'update' event
			let event = new CustomEvent("update.swift.pageupdater", {
				cancelable: true,
				detail: {
					formData: formData,
					parentEvent: e
				}
			});
			var globalDispatcher = document.dispatchEvent(event);
			var localDispatcher = clickedButton.dispatchEvent(event);

			if (globalDispatcher != false && localDispatcher != false) {
				//UI updates
				var preloaderTargetElement = type != "inline" ? form : responseTargetElement;
				var addPreloaderTimer = setTimeout(function () {
					PageUpdater.AddPreloaders(type, preloaderTargetElement);
				}, 200); //Small delay to secure that the preloader is not loaded all the time

				//Fetch
				let response = await fetch(form.action, fetchOptions);

				if (response.ok) {
					PageUpdater.Success(response, addPreloaderTimer, formData, responseTargetElement);
				} else {
					PageUpdater.Error(response, addPreloaderTimer);
				}
			}
		},

		UpdateFromUrl: async function (e, url) {
			var clickedButton = e.currentTarget != undefined ? e.currentTarget : e;
			var layoutTemplate = clickedButton.getAttribute("data-layout-template") ? clickedButton.getAttribute("data-layout-template") : "Swift_PageClean.cshtml";
			var responseTargetElement = clickedButton.getAttribute("data-response-target-element") ? "#" + document.querySelector(clickedButton.getAttribute("data-response-target-element")) : clickedButton;

			url += "&LayoutTemplate=" + layoutTemplate;

			//Fire the 'update' event
			let event = new CustomEvent("update.swift.pageupdater", {
				cancelable: true,
				detail: {
					parentEvent: e
				}
			});
			var globalDispatcher = document.dispatchEvent(event);
			var localDispatcher = clickedButton.dispatchEvent(event);

			if (globalDispatcher != false && localDispatcher != false) {
				//UI updates
				var addPreloaderTimer = setTimeout(function () {
					PageUpdater.AddPreloaders("inline", clickedButton);
				}, 200); //Small delay to secure that the preloader is not loaded all the time

				//Fetch
				let response = await fetch(url);

				if (response.ok) {
					PageUpdater.Success(response, addPreloaderTimer, new FormData(), responseTargetElement);
				} else {
					PageUpdater.Error(response, addPreloaderTimer);
				}
			}
		},

		AddPreloaders: function (type, targetElement, addPreloaderTimer) {	//Private method
			if (type != "inline") {
				var overlayElement = document.createElement('div');
				overlayElement.className = "preloader-overlay";
				overlayElement.setAttribute('id', "overlay");
				var overlayElementIcon = document.createElement('div');
				overlayElementIcon.className = "preloader-overlay-icon";
				overlayElementIcon.style.top = window.pageYOffset + "px";
				overlayElement.appendChild(overlayElementIcon);

				if (targetElement) {
					targetElement.parentNode.insertBefore(overlayElement, targetElement);
				}
			} else {
				if (targetElement != null) {
					targetElement.innerHTML = "";
				}

				var preloaderElement = document.createElement('div');
				preloaderElement.className = "d-flex icon-1";
				var preloaderSpinner = document.createElement('div');
				preloaderSpinner.className = "spinner-border m-auto";
				preloaderElement.appendChild(preloaderSpinner);
				var helper = document.createElement('span');
				helper.className = "visually-hidden";
				helper.innerHTML = "Loading...";
				preloaderElement.appendChild(helper);

				if (targetElement != null) {
					targetElement.appendChild(preloaderElement);
				}
			}
		},

		Success: async function (response, addPreloaderTimer, formData, responseTargetElement) {
			clearTimeout(addPreloaderTimer);

			let html = await response.text().then(function (text) {
				return text;
			});

			//Fire the 'updated' event
			let event = new CustomEvent("updated.swift.pageupdater", {
				cancelable: true,
				detail: {
					formData: formData,
					html: html
				}
			});
			var globalDispatcher = document.dispatchEvent(event);

			if (globalDispatcher != false) {
				//Remove preloader
				if (document.querySelector("#overlay")) {
					document.querySelector("#overlay").parentNode.removeChild(document.querySelector("#overlay"));
				}

				//Replace content
				if (responseTargetElement != null) {
					responseTargetElement.innerHTML = html;

					//Run scripts from the loaded html
					var scripts = Array.prototype.slice.call(responseTargetElement.getElementsByTagName("script"));
					for (var i = 0; i < scripts.length; i++) {
						if (scripts[i].src != "") {
							var tag = document.createElement("script");
							tag.src = scripts[i].src;
							document.getElementsByTagName("head")[0].appendChild(tag);
						}
						else {
							eval(scripts[i].innerHTML);
						}
					}
				}
			}
		},

		Error: function (e, responseTargetElement, addPreloaderTimer) {
			clearTimeout(addPreloaderTimer);

			if (document.querySelector("#overlay")) {
				document.querySelector("#overlay").parentNode.removeChild(document.querySelector("#overlay"));
			}
		}
	}
}();

export { PageUpdater };
