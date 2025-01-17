import {Component, toChildArray} 	from 'preact';
import {Diff}	 				from 'shallow';

export default class ContentBodyCommon extends Component {
	constructor( props ) {
		super(props);
	}

	shouldComponentUpdate( nextProps ) {
		return Diff(toChildArray(this.props.children), toChildArray(nextProps.children));
	}

	render( props ) {
		// '-body' for backwards compatibility (remove me)
		var _class = "content-body content-body-common -body" + (props.class ? " "+props.class : "");

		return <div class={_class}>{props.children}</div>;
	}
}
