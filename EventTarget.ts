// @ts-ignore
class Emitter
{
	private readonly _listeners;

	constructor()
	{
		this._listeners = new Map();
	}

	addEventListener(type, listener)
	{
		this._listeners.set(listener.bind(this), {
			type, listener,
		});
	}

	removeEventListener(type, listener)
	{
		for(let [key, value] of this._listeners)
		{
			if(value.type !== type || listener !== value.listener)
			{
				continue;
			}
			this._listeners.delete(key);
		}
	}

	dispatchEvent(event)
	{
		Object.defineProperty(event, 'target', { value: this });
		this['on' + event.type] && this['on' + event.type](event);
		for(let [key, value] of this._listeners)
		{
			if(value.type !== event.type)
			{
				continue;
			}
			key(event);
		}
	}
}
