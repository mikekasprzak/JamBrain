import { Component, toChildArray } from 'preact';
import './grid.less';
import cN							from 'classnames';

import GridCol from 'com/grid/col/col';
import GridRow from 'com/grid/row/row';
import GridContainer from 'com/grid/container/container';

/** @deprecated */
export default class Grid extends Component {
	constructor( props ) {
		super(props);
	}

	render( props ) {
		let {columns = 3} = props;

		return (
			<GridContainer {...props} class={`-grid ${props.class ?? ''}`}>
				{
						toChildArray(props.children).map((child, index) => {
							return (
								<GridCol flexGrow={0} flexBasis={100 / columns}>{child}</GridCol>
							);
					})
				}
			</GridContainer>
		);
	}
}
