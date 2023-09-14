import { Component } from 'preact';
import './headliner.less';
import cN from 'classnames';

import {getLocaleDate, getRoughAge} from 'internal/time';

import {UIIcon, UIButton} from 'com/ui';

//import $Node from 'shrub/js/node/node';

/** @deprecated */
export default class ContentHeadliner extends Component {
	constructor( props ) {
		super(props);
	}


	renderItem( node ) {
		let props = this.props;

		if ( node ) {
			// Build Title
			let Title = [];
			Title.push(<span class="-main">{node.name}</span>);


			// Build Subtext
			let Subtext = [];

			if ( props.published ) {
				Subtext.push(this.renderWhen(node, (typeof props.published == 'string') ? props.published : 'published'));
			}

			if ( props.love ) {
				Subtext.push(
					<div title="Love" class="-statistic">
						<UIIcon small baseline>heart</UIIcon> <span>{node.love}</span>
					</div>
				);
			}

			if ( props.comments ) {
				Subtext.push(
					<div title="Comments" class="-statistic">
						<UIIcon small baseline>bubble</UIIcon> <span>{node.comments}</span>
					</div>
				);
			}

			if ( props.games && node.games ) {
				Subtext.push(
					<div title="Games" class="-statistic">
						<UIIcon small baseline>gamepad</UIIcon> <span>{node.games}</span>
					</div>
				);
			}

			if ( props.articles && node.articles ) {
				Subtext.push(
					<div title="Articles" class="-statistic">
						<UIIcon small baseline>article</UIIcon> <span>{node.articles}</span>
					</div>
				);
			}


			let Body = null;
			if ( Subtext.length ) {
				Body = (
					<div class="-top-bot">
						<div class="-title _font2">{Title}</div>
						<div class="-subtext">{Subtext}</div>
					</div>
				);
			}
			else {
				Body = (
					<div class="-fill">
						<div class="-title _font2">{Title}</div>
					</div>
				);
			}


			// Render
			return <UIButton class={`item -list-item ${props.childclass ?? ''}`} href={node.path}>{Body}</UIButton>;
		}
		return null;
	}


	renderNullItem() {
		let props = this.props;

		let Body = (
			<div class="-fill">
				<div class="-title _font2">{props.title}</div>
			</div>
		);

		return <div class={`item -list-item ${props.childclass ?? ''}`}>{Body}</div>;
	}


	renderItems( node ) {
		if ( !node ) {
			return this.renderNullItem();
		}
		else if ( Array.isArray(node) ) {
			let ret = [];
			for ( let idx = 0; idx < node.length; idx++ ) {
				ret.push(this.renderItem(node[idx]));
			}
			return ret;
		}
		else {
			return this.renderItem(node);
		}
	}


	renderWhen( node, label, show_new_for_minutes = 24*60 ) {
		if ( node.published ) {
			let date_pub = new Date(node.published);
			if ( node.meta['origin-date'] ) {
				date_pub = new Date(node.meta['origin-date']);
			}
			let date_now = new Date();
			let pub_diff = (date_now.getTime() - date_pub.getTime());// - (date_now.getTimezoneOffset()*60);

			let ret = [];

			// Optionally include [NEW] label
			if ( (show_new_for_minutes !== null) && (pub_diff < (show_new_for_minutes*60*1000)) ) {
				ret.push(<span class="-label">NEW</span>);
				ret.push(' ');
			}

			ret.push(<span>{label}</span>);
			ret.push(' ');
			ret.push(<span title={getLocaleDate(date_pub)}>{getRoughAge(pub_diff)}</span>);

			// x minutes ago
			return <div>{ret}</div>;
		}
		else {
			return <div>not {label} yet</div>;
		}
	}


	renderFlag( props ) {
		// Build the flag
		let Flag = [];
		// The Icon
		if ( props.icon ) {
			Flag.push(<UIIcon big>{props.icon}</UIIcon>);
		}
		// The Name
		if ( props.name ) {
			// If there's an icon, optionally hide the name if sidebar is hidden
			let NameClass = `-text ${props.icon ? 'if-sidebar-inline' : ''}`;
			// Add name text
			Flag.push(<span class={NameClass}>{props.name.toUpperCase()}</span>);
		}

		// Only show the flag if it contains something
		return Flag.length ? <UIButton class={`flag ${props.flagclass ?? ''}`} href={props.href}>{Flag}</UIButton> : null;
	}


	renderFooter( props ) {
		// Show the footer
		if ( props.footer ) {
			return <UIButton class={`item -footer-item ${props.childclass ?? ''}`} href={props.footerhref}>{props.footer}</UIButton>;
		}
		// Show the more footer
		else if ( props.more ) {
			return (
				<UIButton class={`item -more-item ${props.childclass ?? ''}`} href={props.more}>
					<UIIcon>circle</UIIcon><UIIcon>circle</UIIcon><UIIcon>circle</UIIcon>
				</UIButton>
			);
		}
	}


	render( props ) {
		let Flag = this.renderFlag(props);
		let Items = this.renderItems(props.node);
		let Footer = this.renderFooter(props);

		// Render
		return <header class={`content -headliner ${props.class ?? ''}`} style={props.style}>{Flag}{Items}{Footer}</header>;
	}
}
