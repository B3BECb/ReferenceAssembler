class SinglePageModule
{
	public static async Initialize(loader : Framework.IDependenceRegistrable)
	{
		await loader.RegisterScript("ViewModelBase.js")
					.RegisterScript("SinglePageElement.js")
					.ApplyRegistrations()
					.Resolve();
	}
}