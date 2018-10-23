class RedRectangleViewModel
	extends Framework.ViewModelBase
{
	constructor(loader: Framework.IDependenceRegistrable)
	{
		super(loader);
	}

	public async Initialize()
	{
		document.querySelector("#rect")
				.addEventListener("click", () =>
				{
					this.dispatchEvent(new CustomEvent('change'));
				});
	}
}