class Page21ViewModel
	extends Framework.ViewModelBase
{
	constructor(loader: Framework.IDependenceRegistrable)
	{
		super(loader);
	}

	Initialize()
	{
		this._loader
			.RegisterScript('')
			.ApplyRegistrations()
			.RegisterHtml('')
			.WithName('')
			.WithScript('')
			.AsType(Framework.RegistrationTypes.Page)
			.ApplyRegistrations()
			.Resolve();
	}
}