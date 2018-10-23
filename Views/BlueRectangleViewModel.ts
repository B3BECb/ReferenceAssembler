class BlueRectangleViewModel
	extends Framework.ViewModelBase
{
	public async Initialize()
	{
		document.querySelector("#rect")
			.addEventListener("click", () =>
			{
				this.dispatchEvent(new CustomEvent('change'));
			});
	}
}