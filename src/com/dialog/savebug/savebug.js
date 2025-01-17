import { Component } from 'preact';
import DialogCommon						from 'com/dialog/common/common';

export default class DialogSavebug extends Component {
	constructor( props ) {
		super(props);
	}

	render() {
		return (
			<DialogCommon title="Oops!" ok>
				<div>Oops!! It looks like the website logged you out! This is a bug. :(</div>
				<div>As a workaround, Copy+paste your changes somewhere (a text editor), reload the page, login and try again. It should work.</div>
				<div>Sorry about this!</div>
			</DialogCommon>
		);
	}
}
