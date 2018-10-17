class Registrator {
    constructor() {
        this.Registrations = [];
    }
    RegisterView(url) {
        let registration = new Registration(url);
        if (!this._loadingStarted) {
            this.Registrations.push(registration);
        }
        else {
            let firstUnloadedRegIndex = this.GetFirstUnloadedRegIndex();
            this.Registrations.splice(firstUnloadedRegIndex, 0, registration);
        }
        return this;
    }
    WithViewModel(url) {
        let last;
        if (!this._loadingStarted) {
            last = this.GetLastRegistration();
        }
        else {
            last = this.Registrations[this.GetFirstUnloadedRegIndex()];
        }
        last.ViewModelUrl = url;
        return this;
    }
    AsType(type) {
        let last;
        if (!this._loadingStarted) {
            last = this.GetLastRegistration();
        }
        else {
            last = this.Registrations[this.GetFirstUnloadedRegIndex()];
        }
        last.Type = type;
        return this;
    }
    async Build() {
        this._loadingStarted = true;
        for (let id = 0; id < this.Registrations.length; id++) {
            let registration = this.Registrations[id];
            if (!registration.ViewModelUrl || !registration.Type == null) {
                console.error("Unable to load registration. ViewModelUrl or Type is empty.");
                return false;
            }
            let loadingResult = await this.TryLoadView(registration);
            if (!loadingResult) {
                return false;
            }
            loadingResult = await this.TryLoadViewModel(registration, id);
            if (!loadingResult) {
                return false;
            }
            registration.IsLoaded = true;
        }
        return true;
        /*let tasks = this.Registrations.map(
            async(registration, id) =>
            {
                if(!registration.ViewModelUrl || !registration.Type == null)
                {
                    console.error("Unable to load registration. ViewModelUrl or Type is empty.");
                    return false;
                }

                let loadingResult = await this.TryLoadView(registration);

                if(!loadingResult)
                {
                    return false;
                }

                loadingResult = await this.TryLoadViewModel(registration, id);

                if(!loadingResult)
                {
                    return false;
                }

                registration.IsLoaded = true;
            },
        );*/
        //await Promise.all(tasks);
    }
    async TryLoadView(registration) {
        let response;
        try {
            response = await fetch(registration.ViewUrl);
        }
        catch (exc) {
            console.error(exc);
            return false;
        }
        if (response.status >= 200 && response.status <= 300) {
            let data = await response.text();
            let tag = document.createElement('template');
            tag.innerHTML = data;
            registration.ViewContent = tag.content;
            return true;
        }
        console.error("Unable to load view. Response status is: " + response.status);
        return false;
    }
    async TryLoadViewModel(registration, id) {
        let element = document.createElement('script');
        element.type = 'text/javascript';
        element.src = registration.ViewModelUrl;
        element.id = "ViewModel_" + id;
        let loadingPromise = new Promise((resolve, reject) => {
            element.onload = (args) => {
                resolve();
            };
            element.onerror = (args) => {
                reject(new Error(args.message));
            };
        });
        document.querySelector('head')
            .appendChild(element);
        try {
            await loadingPromise;
            return true;
        }
        catch (exc) {
            console.error("Unable to load viewModel. Reason is: " + exc);
            return false;
        }
    }
    GetLastRegistration() {
        return this.Registrations.slice(-1)[0];
    }
    GetFirstUnloadedRegIndex() {
        let firstUnloadedRegIndex = this.Registrations.findIndex(x => !x.IsLoaded) + 1;
        return firstUnloadedRegIndex;
    }
}
class Registration {
    constructor(url) {
        this.ViewUrl = url;
    }
}
var RegistrationTypes;
(function (RegistrationTypes) {
    RegistrationTypes[RegistrationTypes["Page"] = 0] = "Page";
    RegistrationTypes[RegistrationTypes["Window"] = 1] = "Window";
})(RegistrationTypes || (RegistrationTypes = {}));
//# sourceMappingURL=Registrator.js.map