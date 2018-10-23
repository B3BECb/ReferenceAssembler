import ISinglePageElement = Framework.ISinglePageElement;

class IndexViewModel
{
	private Loader: Framework.IDependenceRegistrable;

	private BlueRectangleView: Framework.ISinglePageElement<BlueRectangleViewModel>;

	private RedRectangleView: Framework.ISinglePageElement<RedRectangleView>;

	constructor()
	{
		this.Loader = new Framework.DependenciesLoader();
	}

	async Initialize()
	{
		await this.Loader
				  .RegisterScript("SinglePageModule.js")
				  .ApplyRegistrations()
				  .Resolve();

		await SinglePageModule.Initialize(this.Loader);

		await this.Loader.RegisterHtml("Views/BlueRectangleView.html")
				  .WithScript("Views/BlueRectangleViewModel.js", registration =>
				  {
					  let page               = new Framework.SinglePageElement<BlueRectangleViewModel>();
					  page.ViewModel         = new BlueRectangleViewModel(this.Loader);
					  page.Fragment          = registration.HtmlUrl.ViewContent;
					  this.BlueRectangleView = page;
				  })
				  .AsType(Framework.RegistrationTypes.Page)
				  .ApplyRegistrations()
				  .Resolve();

		await this.InsertPage(this.BlueRectangleView);
		this.BlueRectangleView.ViewModel.addEventListener('change', async() => await this.SwitchPages());

		this.Loader
			.RegisterHtml("Views/RedRectangleView.html")
			.WithScript("Views/RedRectangleViewModel.js", registration =>
			{
				let page              = new Framework.SinglePageElement<RedRectangleView>();
				page.ViewModel        = new RedRectangleView(this.Loader);
				page.Fragment         = registration.HtmlUrl.ViewContent;
				this.RedRectangleView = page;
			})
			.AsType(Framework.RegistrationTypes.Page)
			.ApplyRegistrations()
			.Resolve();
	}

	async InsertPage<T extends Framework.IViewModel>(page: Framework.ISinglePageElement<T>)
	{
		let container = document.querySelector("body");

		while(container.firstChild)
		{
			container.removeChild(container.firstChild);
		}

		let template: HTMLTemplateElement = page.Fragment.querySelector('#content');
		container.appendChild(template.content.cloneNode(true));

		await page.ViewModel.Initialize();

		page.IsActive = true;
	}

	async SwitchPages()
	{
		await this.InsertPage(this.BlueRectangleView[2] ? this.RedRectangleView : this.BlueRectangleView);
	}
}