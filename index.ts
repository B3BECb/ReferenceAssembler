class IndexViewModel
{
	private Loader: Framework.IDependenceRegistrable;

	private BlueRectangleView : [DocumentFragment, BlueRectangleViewModel, boolean];

	private RedRectangleView : [DocumentFragment, Page21ViewModel, boolean];

	constructor()
	{
		this.Loader = new Framework.DependenciesLoader();
	}

	async Initialize()
	{
		await this.Loader
			.RegisterScript("ViewModelBase.js")
			.RegisterHtml("Views/BlueRectangleView.html")
			.WithScript("Views/BlueRectangleViewModel.js", registration =>
			{
				this.BlueRectangleView = [registration.HtmlUrl.ViewContent, new BlueRectangleViewModel(this.Loader), false];
			})
			.AsType(Framework.RegistrationTypes.Page)
			.ApplyRegistrations()
			.Resolve();

		await this.InsertPage(this.BlueRectangleView);
		this.BlueRectangleView[1].addEventListener('change', async () => await this.SwitchPages());

		this.Loader
			.RegisterHtml("test/page21View.html")
			.WithScript("test/page21ViewModel.js", registration =>
			{
				this.RedRectangleView = [registration.HtmlUrl.ViewContent, new Page21ViewModel(this.Loader), false];
			})
			.AsType(Framework.RegistrationTypes.Page)
			.ApplyRegistrations()
			.Resolve();
	}

	async InsertPage(page: [DocumentFragment, Framework.ViewModelBase, boolean])
	{
		let container = document.querySelector("body");
		let fragment = page[0];
		let vm = page[1];

		while(container.firstChild)
		{
			container.removeChild(container.firstChild);
		}

		let template : HTMLTemplateElement = fragment.querySelector('#content');
		container.appendChild(template.content.cloneNode(true));

		await vm.Initialize();

		page[2] = true;
	}

	async SwitchPages()
	{
		await this.InsertPage(this.BlueRectangleView[2] ? this.RedRectangleView : this.BlueRectangleView);
	}
}