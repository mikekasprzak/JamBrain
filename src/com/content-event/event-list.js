import {Component} from 'preact';
import './event-list.less';

import Sanitize from 'internal/sanitize';

import {Icon, Button, Tooltip, UISpinner} from 'com/ui';

import $ThemeList from 'backend/js/theme/theme_list';
import $ThemeListVote from 'backend/js/theme/theme_list_vote';
import $ThemeHistory from 'backend/js/theme/theme_history';


export default class ContentEventList extends Component {
	constructor( props ) {
		super(props);

		this.state = {
			'lists': null,
			'names': null,
			'votes': null,
			'page': 1,
			'history': null
		};

		this.renderList = this.renderList.bind(this);
	}

	componentDidMount() {
		const event_id = this.props.node.id;

		$ThemeList.Get(event_id)
		.then(r => {
			if ( r.lists ) {
				var newstate = {
					'lists': r.lists,
					'names': r.names
				};
				if ( r.allowed.length > 0 ) {
					newstate['page'] = r.allowed[r.allowed.length-1];
				}

				this.setState(newstate);
			}
			else {
				this.setState({ 'lists': null });
			}
		})
		.catch(err => {
			this.setState({ 'error': err });
		});

		$ThemeHistory.Get()
		.then(r => {
			if ( r.history ) {
				var ret = {};
				for ( var idx in r.history ) {
					ret[Sanitize.makeSlug(r.history[idx]['theme'])] = r.history[idx];
				}

				this.setState({ 'history': ret });
			}
			else {
				this.setState({ 'error': "no history" });
			}
		})
		.catch(err => {
			this.setState({ 'error': err });
		});

		$ThemeListVote.GetMy(event_id)
		.then(r => {
			if ( r.votes ) {
				this.setState({ 'votes': r.votes });
			}
			else {
				this.setState({ 'votes': null });
			}
		})
		.catch(err => {
			this.setState({ 'error': err });
		});
	}

	addToVotes( id, value ) {
		this.setState(prevState => {
			let votes = {...prevState.votes};
			votes[id] = value;
			return {'votes': votes};
		});
	}

	_submitVote( command, id, e ) {
		return $ThemeListVote[command](id)
		.then(r => {
			if ( r.status === 200 ) {
				this.addToVotes(r.id, r.value);
			}
			else {
				location.href = "#expired";
			}
		})
		.catch(err => {
			this.setState({ 'error': err });
		});
	}

	onYes( id, e ) {
		return this._submitVote('Yes', id, e);
	}
	onMaybe( id, e ) {
		return this._submitVote('Maybe', id, e);
	}
	onNo( id, e ) {
		return this._submitVote('No', id, e);
	}

	voteToClass( vote ) {
		if ( vote === 1 )
			return ' -yes';
		else if ( vote === 0 )
			return ' -maybe';
		else if ( vote === -1 )
			return ' -no';
		return '';
	}

	renderList( list ) {
		if ( this.state.lists[list] ) {
			var ThemeMode = Number(this.props.node.meta['theme-page-mode-'+list]);
			if ( this.state.votes && ThemeMode === 1 ) {
				var _class = "theme-item";

				var ShowHeadline = null;

//						<h3>{this.state.names[list]}</h3>
				return (
					<div class="theme-list">
						{this.state.lists[list].map(r => {
							var ShowHistory = null;
							if ( this.state.history ) {
								let theme_slug = Sanitize.makeSlug(r.theme);
								if ( this.state.history[theme_slug] ) {
									ShowHistory = (
										<Tooltip class="-label" text={this.state.history[theme_slug]['name']}>
											{this.state.history[theme_slug]['shorthand']}
										</Tooltip>
									);
								}
							}

							return <div class={_class + this.voteToClass(this.state.votes[r.id])}>
								<Button class="-button -no" onClick={this.onNo.bind(this, r.id)}>-1</Button>
								<Button class="-button -maybe" onClick={this.onMaybe.bind(this, r.id)}>0</Button>
								<Button class="-button -yes" onClick={this.onYes.bind(this, r.id)}>+1</Button>
								<span class="-text">{r.theme}</span>
								{ShowHistory}
							</div>;
						})}
						<div class="-tip">
							<strong>NOTE:</strong>{" Votes are sent automatically. When the color changes, they have been accepted."}
						</div>
					</div>
				);
			}
			else if ( ThemeMode === 2 ) {
				return (
//						<h3>{this.state.names[list]}</h3>

					<div class="theme-list">
						<div>This round has ended.</div>
						<br />
						{this.state.lists[list].map(r => {
							var ShowHistory = null;
							if ( this.state.history ) {
								let theme_slug = Sanitize.makeSlug(r.theme);
								if ( this.state.history[theme_slug] ) {
									ShowHistory = (
										<Tooltip class="-label" title={this.state.history[theme_slug]['name']}>
											{this.state.history[theme_slug]['shorthand']}
										</Tooltip>
									);
								}
							}

							let new_class = "theme-item" + (this.state.votes ? this.voteToClass(this.state.votes[r.id]) : "");
							return (
								<div class={new_class}>
									<span class="-text">{r.theme}</span>
									{ShowHistory}
								</div>
							);
						})}
					</div>
				);
			}
			else {
				return [
//					<h3>{this.state.names[list]}</h3>,
					this.state.lists[list].map(r => {
						return <div>{r.theme}</div>;
					})
				];
			}
		}
		else if ( this.state.names[list] ) {
			return [
//				<h3>{this.state.names[list]}</h3>,
				"This round hasn't started yet. Stay tuned!"
			];
		}
		return null;
	}

	render( props, state ) {
		const {user, path, extra, ...otherProps} = props;
		const {lists, names, votes, page, error, ...otherStates} = state;

		// By default, the page is the last available round
		const activePage = (extra && extra.length && extra[0]) ? Number(extra[0]) : page;

		if ( names ) {
			const Title = "Theme Voting "+names[activePage];

			//console.log('lister',user,lists,votes);

			// Page bodies
			var Body = null;
			if ( user && user['id'] && lists && votes ) {
				Body = activePage ? this.renderList(activePage) : null;
			}
			else if ( lists && !lists[activePage] ) {
				Body = [
					"This round hasn't started yet. Stay tuned!"
				];
			}
			else if ( lists ) {
				Body = [
					<div class="-info"><h3>Please log in to vote</h3></div>,
					activePage ? this.renderList(activePage) : null
				];
			}
			else if ( error ) {
				Body = <div>{error}</div>;
			}
			else {
				Body = <UISpinner />;
			}

			// Generate the page
			return (
				<div class="-body">
					<h2><Icon class="-small -baseline -gap" src="ticket" />{Title}</h2>
					{Body}
				</div>
			);
		}

		return null;
	}
}
