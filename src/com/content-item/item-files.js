import {h, Component}					from 'preact/preact';
import ContentCommonBody				from 'com/content-common/common-body';
import UIButton							from 'com/ui/button/button';
import UILink							from 'com/ui/link/link';

import $File							from 'shrub/js/file/file';

export default class ContentItemFiles extends Component {
	constructor(props) {
		super(props);

        this.state = {
            'status': 0
        };

        this.onUpload = this.onUpload.bind(this);
	}

    onUpload( e ) {
		let {node, user} = this.props;

        if ( !user || !user.id || !node )
            return null;

        if ( e.target.files && e.target.files.length ) {
            let file = e.target.files[0];

            this.setState({'status': 2});

            return $File.RequestUpload(user.id, node.id, 0, file)
                .then( r => {
                    if ( r.ok ) {
                        this.setState({'status': 3});

                        return $File.Upload(r, file)
                            .then(r2 => {
                                if ( r2.ok ) {
                                    this.setState({'status': 4});
                                    return $File.ConfirmUpload(r.id, node.id, r.name, r.token, user.id);
                                }
                            });
                    }
                    else {
                        this.setState({'status': 1});
                        alert(r.message);
                    }
                })
                .then( r => {
                    this.setState({'status': 5});
                    console.log("Uploaded", r);
                })
                .catch(err => {
                    this.setState({'status': 5});
                    alert(err);
                    this.setState({'error': err});
                });
        }
    }

    onDelete( e ) {
        let {node, user} = this.props;

        if ( !user || !user.id || !node )
            return null;

        console.log("onDelete", e.id, e.name);

        return $File.RequestDelete(e.id, e.name, node.id)
            .then( r => {
                if ( r.ok ) {
                    return $File.Delete(r);
                        /*.then(r2 => {
                            if ( r2.ok ) {
                                return $File.ConfirmDelete(r.id, r.name, r.token, user.id);
                            }
                        });*/
                }
                else {
                    alert(r.message);
                }
            })
            .then( r => {
                console.log("Deleted", r);
            })
            .catch(err => {
                alert(err);
                this.setState({'error': err});
            });
    }

    render(props, state) {
        let {node, parent} = props;

        let latestFiles = {};
        node.files.forEach(e => {
            latestFiles[e.name] = e;
        });

        // Show the upload interface
        if ( props.edit ) {
            if ( !node || !parent || !node_CanUpload(parent) ) {
                return <div />;
            }

            let files = [];
            Object.values(latestFiles).forEach(e => {
                if ( (e.status & 0x1) && !(e.status & 0x40) ) {
                    let func = this.onDelete.bind(this, e);
                    files.push(<li>{e.name} [{e.status.toString(16)}] - {e.timestamp} - {e.size} bytes - <UIButton style="display: inline;" onclick={func}>delete</UIButton></li>);
                }
            });

            const status = [
                "Upload File",
                "Upload File: ERROR",
                "Upload File: Requested...",
                "Upload File: Uploading...",
                "Upload File: Verifying...",
                "Upload File: Success",
            ];

            return (
                <ContentCommonBody class="-files -body -upload">
                    <div class="-label">Downloads</div>
                    <ul>{files}</ul>
                    <label>
                        <input type="file" name="file" style="display: none;" onchange={this.onUpload} onprogress={this.onProgress} />
                        <UIButton class="-button">{status[state.status]}</UIButton>
                    </label>
                </ContentCommonBody>
            );
        }

        if ( !node || !node.files || !node.files.length || !Object.values(latestFiles).length ) {
            return <div />;
        }

        // View //

        let files = [];
        Object.values(latestFiles).forEach(e => {
            if ( !(e.status & 0x40) ) {
                files.push(<li><UILink href={"//files.jam.host/uploads/$"+node.id+"/"+e.name}>{e.name}</UILink> - {e.size} bytes</li>);
            }
        });

        if ( files.length ) {
            return (
                <ContentCommonBody class="-files -body -upload">
                    <div class="-label">Downloads</div>
                    <ul>{files}</ul>
                </ContentCommonBody>
            );
        }

        return <div />;
    }
}