class SinglePageModule
{
	public static async Initialize(loader : Framework.IDependenceRegistrable)
	{
		try
		{
			new EventTarget();
			loader.RegisterScript('Emitter.js');
		}
		catch(exc)
		{
			loader.RegisterScript('EventTarget.js');
		}

		await loader.RegisterScript("ViewModelBase.js")
					.RegisterScript("SinglePageElement.js")
					.ApplyRegistrations()
					.Resolve();
	}
}