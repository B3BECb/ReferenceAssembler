class BlueRectangleViewModel
	extends Framework.ViewModelBase
{
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