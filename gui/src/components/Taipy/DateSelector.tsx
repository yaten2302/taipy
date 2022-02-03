import React, { useState, useEffect, useCallback, useContext } from "react";
import DatePicker from "@mui/lab/DatePicker";
import DateTimePicker from "@mui/lab/DateTimePicker";
import TextField from "@mui/material/TextField";
import { isValid } from "date-fns";

import { TaipyContext } from "../../context/taipyContext";
import { createSendUpdateAction } from "../../context/taipyReducers";
import { TaipyActiveProps } from "./utils";
import { getDateTime, getClientServerTimeZoneOffset } from "../../utils";
import { useDynamicProperty, useFormatConfig } from "../../utils/hooks";

interface DateSelectorProps extends TaipyActiveProps {
    withTime?: boolean;
    format?: string;
    date: string;
    defaultDate?: string;
}

const DateSelector = (props: DateSelectorProps) => {
    const { className, tp_varname, withTime = false, id, propagate = true } = props;
    const { dispatch } = useContext(TaipyContext);
    const formatConfig = useFormatConfig();
    const tz = formatConfig.timeZone;
    const [value, setValue] = useState(() => getDateTime(props.defaultDate, tz));

    const active = useDynamicProperty(props.active, props.defaultActive, true);

    const handleChange = useCallback(
        (v) => {
            setValue(v);
            const newDate = new Date(v);
            if (isValid(newDate)) {
                // dispatch new date which offset by the timeZone differences between client and server
                const hours = getClientServerTimeZoneOffset(tz) / 60;
                const minutes = getClientServerTimeZoneOffset(tz) % 60;
                newDate.setSeconds(0);
                newDate.setMilliseconds(0);
                if (withTime) {
                    // Parse data with selected time if it is a datetime selector
                    newDate.setHours(newDate.getHours() + hours);
                    newDate.setMinutes(newDate.getMinutes() + minutes);
                } else {
                    // Parse data with 00:00 UTC time if it is a date selector
                    newDate.setHours(hours);
                    newDate.setMinutes(minutes);
                }
                dispatch(createSendUpdateAction(tp_varname, newDate.toISOString(), propagate));
            }
        },
        [tp_varname, dispatch, withTime, propagate, tz]
    );

    const renderInput = useCallback(
        (params) => <TextField id={id} {...params} className={className} />,
        [id, className]
    );

    // Run every time props.value get updated
    useEffect(() => {
        if (props.date !== undefined) {
            setValue(getDateTime(props.date, tz));
        }
    }, [props.date, tz]);

    return withTime ? (
        <DateTimePicker
            value={value}
            onChange={handleChange}
            renderInput={renderInput}
            className={className}
            disabled={!active}
        />
    ) : (
        <DatePicker
            value={value}
            onChange={handleChange}
            renderInput={renderInput}
            className={className}
            disabled={!active}
        />
    );
};

export default DateSelector;
