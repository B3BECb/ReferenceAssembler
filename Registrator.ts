class Registrator
	implements IViewRegistrable,
			   IViewModelRegistrable,
			   IRegistrationTypeRegistrable,
			   IRegistrationBuildable,
			   IRegistrationApplicable
{
	public _registrations: Registration[];

	public _asyncRegistrations: Registration[];

	public _loadedRegistrations: Registration[];

	public _registrationBuffer: Registration[];

	private _loadingStarted: boolean;

	private _lastLoadedRegistration: number;

	constructor()
	{
		this._registrations       = [];
		this._asyncRegistrations  = [];
		this._loadedRegistrations = [];
		this._registrationBuffer  = [];
	}

	public RegisterScript(url: string): IRegistrationApplicable
	{
		let registration = new Registration();

		registration.ScriptUrl = url;
		registration.Type = RegistrationTypes.Script;

		this._registrationBuffer.unshift(registration);

		return this;
	}

	public RegisterView(url: string): IViewModelRegistrable
	{
		let registration = new Registration();

		registration.HtmlContentUrl = url;

		this._registrationBuffer.unshift(registration);

		return this;
	}

	public WithViewModel(url: string): IRegistrationTypeRegistrable
	{
		let last = this._registrationBuffer[0];

		last.ScriptUrl = url;

		return this;
	}

	public AsType(type: RegistrationTypes): IRegistrationApplicable
	{
		let last = this._registrationBuffer[0];

		last.Type = type;

		return this;
	}

	public ApplySequence(isAsyncLoading: boolean = false): IRegistrationBuildable
	{
		this._registrationBuffer.forEach(x => x.IsAsyncLoad = isAsyncLoading);
		let reversed = this._registrationBuffer.reverse();

		if(isAsyncLoading)
		{
			this._asyncRegistrations = reversed.concat(this._asyncRegistrations);
		}
		else
		{
			this._registrations = reversed.concat(this._registrations);
		}

		this._registrationBuffer = [];

		return this;
	}

	public async Build()
	{
		this._loadingStarted = true;

		while(this._registrations.length || this._asyncRegistrations.length)
		{
			if(this._asyncRegistrations.length)
			{
				await this.LoadAsyncRegistrations();
			}

			if(this._registrations.length)
			{
				await this.LoadRegistrations();
			}
		}

		return true;
	}

	private async LoadAsyncRegistrations()
	{
		let tasks = this._asyncRegistrations.map(
			async(registration, id) =>
			{
				if(!registration.Type == null)
				{
					console.error("Unable to load registration. ViewModelUrl or Type is empty.");
					return false;
				}

				let isLoaded = await this.TryLoad(registration, "async_" + id);

				registration.IsLoaded = isLoaded;

				this._loadedRegistrations.push(registration);
				this._asyncRegistrations.shift();
			},
		);

		await Promise.all(tasks);
	}

	private async LoadRegistrations()
	{
		let id = 0;
		while(this._registrations.length)
		{
			let registration = this._registrations.shift();

			let isLoaded = await this.TryLoad(registration, "sync_" + id);

			registration.IsLoaded = isLoaded;

			this._loadedRegistrations.push(registration);

			id++;
		}
	}

	private async TryLoad(registration:Registration, id:string) : Promise<boolean>
	{
		if(!registration.Type == null)
		{
			console.error("Unable to load registration. ViewModelUrl or Type is empty.");
			return false;
		}

		let loadingResult: boolean;

		if(registration.HtmlContentUrl)
		{
			loadingResult = await this.TryLoadView(registration);

			if(!loadingResult)
			{
				return false;
			}
		}

		if(registration.ScriptUrl)
		{
			loadingResult = await this.TryLoadViewModel(registration, id);

			if(!loadingResult)
			{
				return false;
			}
		}

		return true;
	}

	private async TryLoadView(registration: Registration): Promise<boolean>
	{
		let response: Response;

		try
		{
			response = await fetch(registration.HtmlContentUrl);
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

	private async TryLoadViewModel(registration: Registration, id: string): Promise<boolean>
	{
		let element  = document.createElement('script');
		element.type = 'text/javascript';
		element.src  = registration.ScriptUrl;

		let prefix = "ViewModel_";

		if(RegistrationTypes.Script)
		{
			prefix = "Script_";
		}

		element.id = prefix + id;

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
}

interface IViewRegistrable
{
	RegisterView(url: string): IViewModelRegistrable;
	RegisterScript(url: string): IRegistrationApplicable;
}

interface IRegistrationBuildable
	extends IViewRegistrable
{
	Build(): Promise<boolean>;
}

interface IRegistrationApplicable
	extends IViewRegistrable
{
	ApplySequence(isAsyncLoading: boolean): IRegistrationBuildable;
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
	public HtmlContentUrl: string;
	public ScriptUrl: string;
	public Type: RegistrationTypes;
	public IsLoaded: boolean;
	public IsAsyncLoad ?: boolean;

	public ViewContent: DocumentFragment;

	constructor()
	{
	}
}

enum RegistrationTypes
{
	Page,
	Window,
	Script,
}