import { h, render, Component }			from 'preact/preact';
import Sanitize							from '../internal/sanitize/sanitize';
import NavSpinner						from 'com/nav-spinner/spinner';

import ViewBar 							from 'com/view-bar/bar';
import ViewHeader						from 'com/view-header/header';
import ViewSidebar						from 'com/view-sidebar/sidebar';
import ViewContent						from 'com/view-content/content';
import ViewFooter						from 'com/view-footer/footer';

import DialogUnfinished					from 'com/dialog-unfinished/unfinished';
import DialogLogin						from 'com/dialog-login/login';
import DialogRegister					from 'com/dialog-register/register';
import DialogActivate					from 'com/dialog-activate/activate';
import DialogReset						from 'com/dialog-reset/reset';
import DialogPassword					from 'com/dialog-password/password';
import DialogAuth						from 'com/dialog-auth/auth';
import DialogSession					from 'com/dialog-session/session';

import DialogCreate						from 'com/dialog-create/create';

//import AlertBase						from 'com/alert-base/base';

import $Node							from '../shrub/js/node/node';
import $User							from '../shrub/js/user/user';
import $NodeLove						from '../shrub/js/node/node_love';

window.LUDUMDARE_ROOT = '/';
window.SITE_ROOT = 1;

class Main extends Component {
	constructor( props ) {
		super(props);

		var clean = this.cleanLocation(window.location);
		if ( window.location.origin+clean.path !== window.location.href ) {
			console.log("Cleaned URL: "+window.location.href+" => "+window.location.origin+clean.path);
			window.history.replaceState(window.history.state, null, clean.path);
		}
	
		//console.log("History:", window.history.state);
	
		this.state = {
			// URL walking
			'id': 0,
			'path': '',
			'slugs': clean.slugs,
			'extra': [],
			
			// Active Node
			'node': {
				'id': 0
			},
			
			// Root Node
			'root': null,
			
			// Featured Ndde
			'featured': null,
			
			// Active User
			'user': null
		};
		
		window.addEventListener('hashchange', this.onHashChange.bind(this));
		window.addEventListener('navchange', this.onNavChange.bind(this));
		window.addEventListener('popstate', this.onPopState.bind(this));
		
		this.onLogin = this.onLogin.bind(this);
	}

	componentDidMount() {
		this.fetchRoot();
		this.fetchData();
	}

	componentDidUpdate( prevProps, prevState ) {
//		var state_copy = Object.assign({},this.state);
//		history.replaceState(state_copy, null);
		history.replaceState(this.state, null);
	}

	cleanLocation( location ) {
		// Clean the URL
		var clean = {
			pathname: Sanitize.clean_Path(location.pathname),
			search: Sanitize.clean_Query(location.search),
			hash: Sanitize.clean_Hash(location.hash),
		}

		clean.path = clean.pathname + clean.search + clean.hash;

		// Parse the clean URL
		clean.slugs = Sanitize.trimSlashes(clean.pathname).split('/');

		return clean;
	}
	
	getDialog() {
		var props = Sanitize.parseHash(window.location.hash);
		
		if ( window.location.hash ) {
			switch (props.path) {
				case 'user-login':
					props.onlogin = this.onLogin;
					return <DialogLogin {...props} />;
				case 'user-activate':
					return <DialogActivate {...props} />;
				case 'user-register':
					return <DialogRegister {...props} />;
				case 'user-auth':
					return <DialogAuth {...props} />;
				case 'user-reset':
					return <DialogReset {...props} />;
				case 'user-password':
					return <DialogPassword {...props} />;
				case 'expired':
					return <DialogSession {...props} />
				case 'create':
					return <DialogCreate {...props} />
				default:
					return <DialogUnfinished {...props} />;
			};
		}
		return null;
	}
	
	onLogin() {
		this.setState({ 'user': null });
		this.fetchData();
	}
	
	// *** //
	
	fetchRoot() {
		$Node.Get(SITE_ROOT)
			.then(r => {
				console.log("Root Loaded:", r.node.id);
				this.setState({ 'root': r.node });
				
				if ( r.node.meta['featured'] && Number.parseInt(r.node.meta['featured']) > 0 ) {
					this.fetchFeatured(Number.parseInt(r.node.meta['featured']));
				}
			})
			.catch(err => { this.setState({ 'error': err }); });
	}
	
	fetchFeatured( node ) {
		$Node.Get(node)
			.then(r => {
				console.log("Featured Node Loaded:", r.node.id);
				this.setState({ 'featured': r.node });
			})
			.catch(err => { this.setState({ 'error': err }); });
	}
	
	fetchNode() {
		// Walk to the active node
		$Node.Walk(SITE_ROOT, this.state.slugs)
			.then(r => {
				var new_state = { 
					'id': r.node,
					'path': (r.path.length ? '/' : '') +this.state.slugs.slice(0, r.path.length).join('/');,
					'extra': r.extra
				};
				
				// Now, lookup the node
				$Node.Get(r.node)
				.then(rr => {
					if ( rr.node && rr.node.length ) {
						new_state.node = rr.node[0];
						this.setState(new_state);
					}
					else { this.setState({ 'error': err }); }
				})
				.catch(err => { this.setState({ 'error': err }); });
			})
			.catch(err => { this.setState({ 'error': err }); });
	}
	
	fetchUser() {
		// Fetch the Active User
		$User.Get().then(r => {
			console.log("Got User:", r.caller_id);
			
			// If a legit user
			if ( r.caller_id ) {
				r.node['private'] = {};
				
				// Pre-caching Love
				$NodeLove.GetMy()
				.then(() => {
					// Load user's private data
					$Node.GetMy()
					.then(rr => {
						r.node['private']['meta'] = rr.meta;
						r.node['private']['link'] = rr.link;
						r.node['private']['refs'] = rr.refs;
						
						// Finally, user is ready
						console.log("User Loaded:", r.caller_id);
						this.setState({ 'user': r.node });
					})
					.catch(err => {
						this.setState({ 'error': err });
					});
				})
				.catch(err => {
					this.setState({ 'error': err });
				});
				
//				$Node.GetMy()
//				.then(rr => {
//					r.node['private'] = {
//						'meta': rr.meta,
//						'link': rr.link,
//						'refs': rr.refs
//					};
//					
//					this.setState({ 'user': r.node });
//				})
//				.catch(err => {
//					this.setState({ error: err });
//				});
			}
			// User not logged in
			else {
				this.setState({ 
					'user': { 'id': 0 }
				});
			}
		})
		.catch(err => {
			this.setState({ 'error': err });
		});
	}

	fetchFeatured() {
//		// Now lookup the node
//		$Node.Get(r.node)
//		.then(rr => {
//			if ( rr.node && rr.node.length ) {
//				new_state.node = rr.node[0];
//				this.setState(new_state);
//			}
//			else {
//				this.setState({ 'error': err });
//			}
//		})
//		.catch(err => {
//			this.setState({ 'error': err });
//		});
	}

	
	fetchData() {
		if ( !this.state.user )
			this.fetchUser();
		if ( this.state.node && !this.state.node.id )
			this.fetchNode();
	}
		
	// *** //
	
	// Hash Changes are automatically differences
	onHashChange( e ) {
		console.log("hashchange: ", e.newURL);
		
		var slugs = this.cleanLocation(window.location).slugs;
		
		if ( slugs.join() === this.state.slugs.join() ) {
			this.setState({});
		}
		else {
			this.setState({ 
				'id': 0,
				'slugs': slugs 
			});
		}
	}
	// When we navigate by clicking forward
	onNavChange( e ) {
		console.log('navchange:',e.detail.old.href,'=>',e.detail.location.href);
		if ( e.detail.location.href !== e.detail.old.href ) {
			var slugs = this.cleanLocation(e.detail.location).slugs;

			if ( slugs.join() !== this.state.slugs.join() ) {
				history.pushState(null, null, e.detail.location.pathname+e.detail.location.search);

				this.setState({ 
					'id': 0,
					'slugs': slugs, 
					'node': {
						'id': 0
					} 
				});
				this.fetchNode();

				// Scroll to top
				window.scrollTo(0, 0);
			}
		}
	}
	// When we navigate using back/forward buttons
	onPopState( e ) {
		console.log("popstate: ", e.state);
		// NOTE: This is sometimes called on a HashChange with a null state
		if ( e.state ) {
			this.setState(e.state);
		}
	}
	

	render( {}, {node, user, featured, path, extra, error} ) {
		var ShowContent = null;
		
		if ( node.id ) {
			ShowContent = <ViewContent node={node} user={user} path={path} extra={extra} />;
		}
		else {
			ShowContent = (
				<ViewContent>
					{error ? error : <NavSpinner />}
				</ViewContent>
			);
		}

		return (
			<div id="layout">
				<ViewBar user={user} featured={featured} />
				<div class="view">
					<ViewHeader user={user} featured={featured} />
					<div id="content-sidebar">
						{ShowContent}
						<ViewSidebar user={user} featured={featured} />
					</div>
					<ViewFooter />
				</div>					
				{this.getDialog()}
			</div>
		);
	}
};

render(<Main />, document.body);
