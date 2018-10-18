class Registrator
	implements IViewRegistrable,
			   IViewModelRegistrable,
			   IRegistrationTypeRegistrable,
			   IRegistrationBuildable,
			   IRegistrationApplicable
{
	public _registrations: Registration[];

	public _loadedRegistrations: Registration[];

	public _registrationBuffer: Registration[];

	private _loadingStarted: boolean;

	private _lastLoadedRegistration: number;

	constructor()
	{
		this._registrations       = [];
		this._loadedRegistrations = [];
		this._registrationBuffer  = [];
	}

	public RegisterView(url: string): IViewModelRegistrable
	{
		let registration = new Registration(url);

		this._registrationBuffer.unshift(registration);

		return this;
	}

	public WithViewModel(url: string): IRegistrationTypeRegistrable
	{
		let last = this._registrationBuffer[0];

		last.ViewModelUrl = url;

		return this;
	}

	public AsType(type: RegistrationTypes): IRegistrationApplicable
	{
		let last = this._registrationBuffer[0];

		last.Type = type;

		return this;
	}

	public ApplySequence(): IRegistrationBuildable
	{
		let reversed        = this._registrationBuffer.reverse();
		this._registrations = reversed.concat(this._registrations);

		this._registrationBuffer = [];

		return this;
	}

	public async Build()
	{
		this._loadingStarted = true;

		let id = 0;
		while(this._registrations.length)
		{
			let registration = this._registrations.shift();

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

			this._loadedRegistrations.push(registration);

			id++;
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

	private async TryLoadView(registration: Registration): Promise<boolean>
	{
		let response: Response;

		try
		{
			response = await fetch(registration.ViewUrl);
		}
		catch(exc)
		{
			console.error(exc);
			return false;
		}

		if(response.status >= 200 && response.status <= 300)
		{
			let data = await response.text();

			let tag = document.createElement('template');

			tag.innerHTML = data;

			registration.ViewContent = tag.content;

			return true;
		}

		console.error("Unable to load view. Response status is: " + response.status);
		return false;
	}

	private async TryLoadViewModel(registration: Registration, id: number): Promise<boolean>
	{
		let element  = document.createElement('script');
		element.type = 'text/javascript';
		element.src  = registration.ViewModelUrl;

		element.id = "ViewModel_" + id;

		let loadingPromise = new Promise((resolve, reject) =>
		{
			element.onload = (args) =>
			{
				resolve();
			};

			element.onerror = (args) =>
			{
				reject(new Error(args.message));
			};
		});

		document.querySelector('head')
				.appendChild(element);

		try
		{
			await loadingPromise;
			return true;
		}
		catch(exc)
		{
			console.error("Unable to load viewModel. Reason is: " + exc);
			return false;
		}
	}

	private GetLastRegistration(): Registration
	{
		return this._registrations.slice(-1)[0];
	}

	private GetFirstUnloadedRegIndex(): number
	{
		let firstUnloadedRegIndex = this._registrations.findIndex(x => !x.IsLoaded) + 1;

		return firstUnloadedRegIndex;
	}
}

interface IViewRegistrable
{
	RegisterView(url: string): IViewModelRegistrable;
}

interface IRegistrationBuildable
	extends IViewRegistrable
{
	Build(): Promise<boolean>;
}

interface IRegistrationApplicable
	extends IViewRegistrable
{
	ApplySequence(): IRegistrationBuildable;
}

interface IViewModelRegistrable
{
	WithViewModel(url: string): IRegistrationTypeRegistrable;
}

interface IRegistrationTypeRegistrable
{
	AsType(type: RegistrationTypes): IRegistrationApplicable;
}

class Registration
{
	public ViewUrl: string;
	public ViewModelUrl: string;
	public Type: RegistrationTypes;
	public IsLoaded: boolean;
	public IsAsyncLoad ?: boolean;

	public ViewContent: DocumentFragment;

	constructor(url: string)
	{
		this.ViewUrl = url;
	}
}

enum RegistrationTypes
{
	Page,
	Window,
}