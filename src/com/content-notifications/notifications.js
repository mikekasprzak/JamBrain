import './notifications.less';

import {Button, UISpinner} from 'com/ui';
import ContentMore						from 'com/content-more/more';

import NotificationsBase				from 'com/content-notifications/base';
import Notification						from 'com/content-notifications/notification';
import NotificationsFilter				from 'com/content-notifications/filter';

import $Notification					from 'backend/js/notification/notification';

import ContentSimple					from 'com/content-simple/simple';

export default class NotificationsFeed extends NotificationsBase {
	constructor( props ) {
		super(props);

		this.state = {
			'errorStatus': 0,
			'maxReadId': 0,
			'offset': 0,
			'limit': 40,
			'count': 0,
			'notifications': null,
			'notificationIds': [],
			'status': null,
			'highestRead': -1,
		};
		this.fetchMore = this.fetchMore.bind(this);
	}

	componentDidMount() {

		$Notification.GetFeedAll(this.state.offset, this.state.limit ).then((r) => {
			if (r.status == 200) {
				this.processNotificationFeed(r);
			}
			else {
				this.setState({'errorStatus': r.status});
			}
		});

	}

	fetchMore() {
		const offset = this.state.offset + this.state.limit;
		$Notification.GetFeedAll(offset, this.state.limit ).then((r) => {
			if (r.status == 200) {
				this.processNotificationFeed(r);
				this.setState({'offset': offset});
			}
			else {
				this.setState({'errorStatus': r.status});
			}
		});
	}

	render( props, state ) {
		const maxReadId = state.highestRead;
		const processing = state.status === null || this.isLoading();
		const hasMore = !processing && ((state.offset + this.state.limit) < state.count);
		const hasUnread = this.getHighestNotificationInFeed() > maxReadId;
		let ShowNotifications = [];
		const notifications = state.notifications;
		const notificationsOrder = this.getNotificationsOrder();
		const notificationsArray = [];
		notificationsOrder.forEach((identifier) => {
			let notification = notifications.get(identifier);
			notificationsArray.push(notification);
			if (this.shouldShowNotification(notification)) {
				ShowNotifications.push((
					<Notification
						notification={notification}
						class={`-item -notification ${(notification.notification[0].id>maxReadId)?'-new-comment':''}`}
						id={'notification-' + identifier}
					/>
				));
			}
		});

		if ( ShowNotifications.length == 0 ) {
			ShowNotifications.push((
				<div>There are no notifications here. You'll get notifications when other people reply to posts you've made or commented on.</div>
			));
		}

		const ShowGetMore = hasMore ? (<ContentMore onClick={this.fetchMore} />) : null;

		const ShowSetAllRead = hasUnread ? (
			<Button
				class="-button -light focusable"
				id="button-mark-read"
				onClick={
					(e) => {
						this.markReadHighest();
					}
				}>
				Mark all notifications as read
			</Button>) : null;

		const ShowSpinner = processing ? <UISpinner /> : null;

		const ShowError = state.errorStatus ? ( <div class="-error">Error code {state.errorStatus} while fetching notifications</div> ) : null;

		const filters = $Notification.GetFilters();
		const view = (
			<div class="-notifications">
				<NotificationsFilter handleFilterChange={this.handleFilterChange} filters={filters} notifications={notificationsArray}/>
				{ShowSetAllRead}
				{ShowError}
				{ShowNotifications}
				{ShowGetMore}
				{ShowSpinner}
			</div>
			);

		return (
			<ContentSimple class="content-notifications" {...props} notitle nofooter nomarkup viewonly={view} flag={"NOTIFICATIONS"} flagIcon="bubble" />
		);
	}

}
