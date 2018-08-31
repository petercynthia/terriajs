import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import classNames from "classnames";

import addUserCatalogMember from "../../../../Models/addUserCatalogMember";
import createCatalogItemFromFileOrUrl from "../../../../Models/createCatalogItemFromFileOrUrl";
import createCatalogMemberFromType from "../../../../Models/createCatalogMemberFromType";
import Dropdown from "../../../Generic/Dropdown";
import FileInput from "./FileInput.jsx";
import getDataType from "../../../../Core/getDataType";
import ObserveModelMixin from "../../../ObserveModelMixin";
import TerriaError from "../../../../Core/TerriaError";
import addUserFiles from "../../../../Models/addUserFiles";

import Styles from "./add-data.scss";

// Local and remote data have different dataType options
const remoteDataType = getDataType().remoteDataType;
const localDataType = getDataType().localDataType;

/**
 * Add data panel in modal window -> My data tab
 */
const AddData = createReactClass({
    displayName: "AddData",
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: PropTypes.object,
        viewState: PropTypes.object
    },

    getInitialState() {
        return {
            localDataType: localDataType[0], // By default select the first item (auto)
            remoteDataType: remoteDataType[0],
            activeTab: "local", // By default local data tab is active
            remoteUrl: "" // By default there's no remote url
        };
    },

    selectLocalOption(option) {
        this.setState({
            localDataType: option
        });
    },

    selectRemoteOption(option) {
        this.setState({
            remoteDataType: option
        });
    },

    changeTab(active) {
        this.setState({
            activeTab: active
        });
    },

    handleUploadFile(e) {
        addUserFiles(
            e.target.files,
            this.props.terria,
            this.props.viewState,
            this.state.localDataType
        ).then(addedCatalogItems => {
            if (addedCatalogItems.length > 0) {
                this.onFileAddFinished(addedCatalogItems[0]);
            }
        });
    },

    handleUrl(e) {
        const url = this.state.remoteUrl;
        e.preventDefault();
        this.props.terria.analytics.logEvent("addDataUrl", url);
        const that = this;
        let promise;
        if (that.state.remoteDataType.value === "auto") {
            promise = loadFile(that);
        } else {
            const newItem = createCatalogMemberFromType(
                that.state.remoteDataType.value,
                that.props.terria
            );
            newItem.name = that.state.remoteUrl;
            newItem.url = that.state.remoteUrl;
            promise = newItem.load().then(function() {
                return newItem;
            });
        }
        addUserCatalogMember(this.props.terria, promise).then(addedItem => {
            if (addedItem && !(addedItem instanceof TerriaError)) {
                this.onFileAddFinished(addedItem);
            }
        });
    },

    onFileAddFinished(fileToSelect) {
        this.props.viewState.myDataIsUploadView = false;
        this.props.viewState.viewCatalogMember(fileToSelect);
    },

    onRemoteUrlChange(event) {
        this.setState({
            remoteUrl: event.target.value
        });
    },

    renderPanels() {
        const dropdownTheme = {
            dropdown: Styles.dropdown,
            list: Styles.dropdownList,
            isOpen: Styles.dropdownListIsOpen
        };

        const dataTypes = localDataType.reduce(function(
            result,
            currentDataType
        ) {
            if (currentDataType.extensions) {
                return result.concat(
                    currentDataType.extensions.map(extension => "." + extension)
                );
            } else {
                return result;
            }
        },
        []);

        return (
            <div className={Styles.tabPanels}>
                <label className={Styles.label}>Add local data file:</label>
                <FileInput
                    accept={dataTypes.join(",")}
                    onChange={this.handleUploadFile}
                />

                <form className={Styles.urlInput}>
                    <label className={Styles.label}>
                        Add hosted file or web service [URL]:
                    </label>
                    <input
                        value={this.state.remoteUrl}
                        onChange={this.onRemoteUrlChange}
                        className={Styles.urlInputTextBox}
                        type="text"
                        placeholder="e.g. http://data.gov.au/geoserver/wms"
                    />
                    <button
                        type="submit"
                        onClick={this.handleUrl}
                        className={Styles.urlInputBtn}
                    >
                        Add
                    </button>
                </form>
                <If condition={this.state.activeTab === "local"}>
                    <section className={Styles.tabPanel}>
                        <label className={Styles.label}>Settings</label>
                        <Dropdown
                            options={localDataType}
                            selected={this.state.localDataType}
                            selectOption={this.selectLocalOption}
                            matchWidth={true}
                            theme={dropdownTheme}
                        />
                    </section>
                </If>
                <If condition={this.state.activeTab === "web"}>
                    <section className={Styles.tabPanel}>
                        <label className={Styles.label}>Settings</label>
                        <Dropdown
                            options={remoteDataType}
                            selected={this.state.remoteDataType}
                            selectOption={this.selectRemoteOption}
                            matchWidth={true}
                            theme={dropdownTheme}
                        />
                    </section>
                </If>
            </div>
        );
    },

    render() {
        return <div className={Styles.inner}>{this.renderPanels()}</div>;
    }
});

/**
 * Loads a catalog item from a file.
 */
function loadFile(viewModel) {
    return createCatalogItemFromFileOrUrl(
        viewModel.props.terria,
        viewModel.props.viewState,
        viewModel.state.remoteUrl,
        viewModel.state.remoteDataType.value,
        true
    );
}

module.exports = AddData;
