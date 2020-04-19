import {h, Component}					from 'preact/preact';

import ContentEvent						from "com/content-event/event";
import ContentList						from 'com/content-list/list';
import ContentTimeline					from 'com/content-timeline/timeline';
import ContentHeadlinerFeed				from 'com/content-headliner/headliner-feed';
import TimelineRateGames				from 'com/content-timeline/timeline-rategames';

export default class PageRootHome extends Component {
	render( props ) {
		const {node, user, path, extra, featured} = props;

		let ShowHomework = null;
		if ( user && user.id && featured && featured.focus_id ) {
			if ( (featured.meta['can-grade'] == "1") && featured.what && featured.what[featured.focus_id] && featured.what[featured.focus_id].published ) {
				ShowHomework = <TimelineRateGames featured={props.featured} />;
			}
		}

		let ShowEvent = null;
		if ( featured && (!user || !user.id || !featured.focus_id) ) {
			ShowEvent = <ContentEvent node={featured} user={user} path={path} extra={extra} featured={featured} />;
		}

		return (
			<ContentList class="page-home-home">
				{ShowEvent}
				<ContentHeadlinerFeed node={node} types={['post']} subtypes={['news']} methods={['all']} limit={1} name="news" icon="news" class="-col-c" published love comments more="/news" />
				{ShowHomework}
				<ContentTimeline class="content-timeline-posts" types={['post']} methods={['all']} node={node} user={user} path={path} extra={extra} featured={featured} />
			</ContentList>
		);
	}
//                <ContentTimeline class="content-timeline-news" types={['post']} subtypes={['news']} methods={['all']} minimized nomore noemptymessage limit={1} node={node} user={user} path={path} extra={extra} />
//                <ContentHeadliner node={[node, node]} />
}
