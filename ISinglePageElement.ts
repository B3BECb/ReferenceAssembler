namespace Framework
{
	export interface ISinglePageElement<T extends IViewModel>
	{
		readonly Fragment : DocumentFragment;
		readonly ViewModel: T;
		IsActive : boolean;
	}
}