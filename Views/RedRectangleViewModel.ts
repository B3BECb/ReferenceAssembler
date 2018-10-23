class RedRectangleViewModel
	extends Framework.ViewModelBase
{
	constructor(loader: Framework.IDependenceRegistrable)
	{
		super(loader);
	}

	public async Initialize()
	{
		let rect = document.querySelector("#rect");

		if(rect)
		{
			rect.addEventListener("click", () =>
			{
				this.dispatchEvent(new CustomEvent('change'));
			});
		}
	}
}