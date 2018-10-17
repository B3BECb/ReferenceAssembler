class Registrator
	implements IViewRegistrable,
			   IViewModelRegistrable,
			   IRegistrationTypeRegistrable
{
	public Registrations: Registration[];

	private _loadingStarted: boolean;

	private _lastLoadedRegistration: number;

	constructor()
	{
		this.Registrations = [];
	}

	public RegisterView(url: string): IViewModelRegistrable
	{
		let registration = new Registration(url);
		if(!this._loadingStarted)
		{
			this.Registrations.push(registration);
		}
		else
		{
			let firstUnloadedRegIndex = this.GetFirstUnloadedRegIndex();

			this.Registrations.splice(firstUnloadedRegIndex, 0, registration);
		}

		return this;
	}

	public WithViewModel(url: string): IRegistrationTypeRegistrable
	{
		let last : Registration;

		if(!this._loadingStarted)
		{
			last = this.GetLastRegistration();
		}
		else
		{
			last = this.Registrations[this.GetFirstUnloadedRegIndex()];
		}

		last.ViewModelUrl = url;

		return this;
	}

	public AsType(type: RegistrationTypes): IViewRegistrable
	{
		let last : Registration;

		if(!this._loadingStarted)
		{
			last  = this.GetLastRegistration();
		}
		else
		{
			last = this.Registrations[this.GetFirstUnloadedRegIndex()];
		}

		last.Type = type;

		return this;
	}

	public async Build()
	{
		this._loadingStarted = true;

		for(let id = 0; id < this.Registrations.length; id++)
		{
			let registration = this.Registrations[id];

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
		return this.Registrations.slice(-1)[0];
	}

	private GetFirstUnloadedRegIndex() : number
	{
		let firstUnloadedRegIndex = this.Registrations.findIndex(x => !x.IsLoaded) + 1;

		return firstUnloadedRegIndex;
	}
}

interface IViewRegistrable
{
	RegisterView(url: string): IViewModelRegistrable;
	Build() : Promise<boolean>;
}

interface IViewModelRegistrable
{
	WithViewModel(url: string): IRegistrationTypeRegistrable;
}

interface IRegistrationTypeRegistrable
{
	AsType(type: RegistrationTypes): IViewRegistrable;
}

class Registration
{
	public ViewUrl: string;
	public ViewModelUrl: string;
	public Type: RegistrationTypes;
	public IsLoaded : boolean;

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