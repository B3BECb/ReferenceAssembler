namespace Framework
{
	export class DependenciesLoader
		implements IDependenceRegistrable,
				   IViewModelRegistrable,
				   IDependenceTypeRegistrable,
				   IRegistrationResolvable,
				   IRegistrationApplicable
	{
		public _registrations: Registration[];

		public _asyncRegistrations: Registration[];

		public _loadedRegistrations: Registration[];

		public _registrationBuffer: Registration[];

		private _loadingStarted: boolean;

		constructor()
		{
			this._registrations       = [];
			this._asyncRegistrations  = [];
			this._loadedRegistrations = [];
			this._registrationBuffer  = [];
		}

		public RegisterScript(url: string, callback?: OnLoadedCallback): IRegistrationApplicable
		{
			let registration = new Registration();

			registration.ScriptUrl = new RegistrationLink(url, callback);
			registration.Type      = RegistrationTypes.Script;

			this._registrationBuffer.unshift(registration);

			return this;
		}

		public RegisterHtml(url: string, callback?: OnLoadedCallback): IViewModelRegistrable
		{
			let registration = new Registration();

			registration.HtmlUrl = new HtmlRegistrationLink(url, callback);

			this._registrationBuffer.unshift(registration);

			return this;
		}

		public WithScript(url: string, callback?: OnLoadedCallback): IViewModelRegistrable
		{
			let last = this._registrationBuffer[0];

			last.ScriptUrl = new RegistrationLink(url, callback);

			return this;
		}

		public WithName(name: string): IViewModelRegistrable
		{
			let last = this._registrationBuffer[0];

			last.Name = name;

			return this;
		}

		public AsType(type: RegistrationTypes): IRegistrationApplicable
		{
			if(type == RegistrationTypes.Script)
			{
				throw "Html page can't be type of script";
			}

			let last = this._registrationBuffer[0];

			last.Type = type;

			return this;
		}

		public ApplyRegistrations(isAsyncLoading: boolean = false): IRegistrationResolvable
		{
			this._registrationBuffer.forEach(
				x =>
				{
					x.IsAsyncLoad = isAsyncLoading;

					if(!this.IsCanBeLoaded(x.ScriptUrl.Url, x.IsAsyncLoad))
					{
						x.IsSkiped = true;
						console.warn(
							'script: ' + x.ScriptUrl + ' already in loading or is loaded. script will be skip');
					}
				});
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

		public async Resolve()
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

			this._loadingStarted = false;

			return true;
		}

		private async LoadAsyncRegistrations()
		{
			let tasks = this._asyncRegistrations.map(
				async(registration, id) =>
				{
					if(registration.IsSkiped || registration.IsLoaded)
					{
						this._asyncRegistrations.shift();
						return;
					}

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

				if(registration.IsSkiped || registration.IsLoaded)
				{
					this._asyncRegistrations.shift();
					return;
				}

				let isLoaded = await this.TryLoad(registration, "sync_" + id);

				registration.IsLoaded = isLoaded;

				this._loadedRegistrations.push(registration);

				id++;
			}
		}

		private async TryLoad(registration: Registration, id: string): Promise<boolean>
		{
			if(!registration.Type == null)
			{
				console.error("Unable to load registration. ViewModelUrl or Type is empty.");
				return false;
			}

			let loadingResult: boolean;

			if(registration.HtmlUrl)
			{
				loadingResult = await this.TryLoadHtml(registration);

				if(!loadingResult)
				{
					return false;
				}
			}

			if(registration.ScriptUrl)
			{
				loadingResult = await this.TryLoadScript(registration, id);

				if(!loadingResult)
				{
					return false;
				}
			}

			return true;
		}

		private async TryLoadHtml(registration: Registration): Promise<boolean>
		{
			let response: Response;

			try
			{
				response = await fetch(registration.HtmlUrl.Url);
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

				registration.HtmlUrl.ViewContent = tag.content;

				registration.HtmlUrl.Callback(registration);

				return true;
			}

			console.error("Unable to load view. Response status is: " + response.status);
			return false;
		}

		private async TryLoadScript(registration: Registration, id: string): Promise<boolean>
		{
			let element  = document.createElement('script');
			element.type = 'text/javascript';
			element.src  = registration.ScriptUrl.Url;

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
					registration.ScriptUrl.Callback(registration);
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

		private IsCanBeLoaded(url: string, isAsync: boolean): boolean
		{
			let index = this._registrations.findIndex(x => x.ScriptUrl.Url == url);

			if(index >= 0)
			{
				this._registrations.splice(index, 1);
			}
			else
			{
				if(isAsync)
				{
					return !(this._asyncRegistrations.some(x => x.ScriptUrl.Url == url)
						|| this._loadedRegistrations.some(x => x.ScriptUrl.Url == url));
				}
				else
				{
					index = this._asyncRegistrations.findIndex(x => x.ScriptUrl.Url == url);

					if(index >= 0)
					{
						this._asyncRegistrations.splice(index, 1);
					}
				}
			}

			return !this._loadedRegistrations.some(x => x.ScriptUrl.Url == url);
		}
	}

	export interface IDependenceRegistrable
	{
		RegisterHtml(url: string, callback?: OnLoadedCallback): IViewModelRegistrable;

		RegisterScript(url: string, callback?: OnLoadedCallback): IRegistrationApplicable;
	}

	interface IRegistrationResolvable
		extends IDependenceRegistrable
	{
		Resolve(): Promise<boolean>;
	}

	interface IRegistrationApplicable
		extends IDependenceRegistrable
	{
		ApplyRegistrations(isAsyncLoading?: boolean): IRegistrationResolvable;
	}

	interface IDependenceTypeRegistrable
	{
		AsType(type: RegistrationTypes): IRegistrationApplicable;
	}

	interface IViewModelRegistrable
		extends IDependenceTypeRegistrable
	{
		WithScript(url: string, callback?: OnLoadedCallback): IViewModelRegistrable;

		WithName(name: string): IViewModelRegistrable;
	}

	export interface IRegistration
	{
		readonly HtmlUrl: IHtmlRegistrationLink;
		readonly ScriptUrl: IRegistrationLink;
		readonly Name: string;
		readonly Type: RegistrationTypes;
		readonly IsLoaded: boolean;
		readonly IsSkiped: boolean;
		readonly IsAsyncLoad ?: boolean;
	}

	export interface IRegistrationLink
	{
		readonly Url : string;
		readonly Callback : OnLoadedCallback;
	}

	export interface IHtmlRegistrationLink
	{
		readonly ViewContent: DocumentFragment;
	}

	class Registration
		implements IRegistration
	{
		public HtmlUrl: HtmlRegistrationLink;
		public ScriptUrl: RegistrationLink;
		public Name: string;
		public Type: RegistrationTypes;
		public IsLoaded: boolean;
		public IsSkiped: boolean;
		public IsAsyncLoad ?: boolean;

		constructor()
		{
		}
	}

	type OnLoadedCallback = (registration: IRegistration) => void;

	class RegistrationLink
		implements IRegistrationLink
	{
		public Url : string;
		public Callback : OnLoadedCallback;

		constructor(url: string, callback?: OnLoadedCallback)
		{
			this.Url = url;
			this.Callback = callback ? callback : () => {};
		}

	}

	class HtmlRegistrationLink
		extends RegistrationLink
		implements IHtmlRegistrationLink
	{
		public ViewContent: DocumentFragment;

		constructor(url: string, callback?: OnLoadedCallback)
		{
			super(url, callback);
		}

	}

	export enum RegistrationTypes
	{
		Page,
		Window,
		Script,
	}
}

