const SUPABASE_URL =
    "https://ctneboruhdpcghddepyj.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_dOTuTnsC1a1h-qUASKYXIg_Qvd28e-d";


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


// ========================================
// BIẾN
// ========================================

let currentWeekStart = getMonday(new Date());

let selectedDate = null;

let selectedNote = null;


// ========================================
// ELEMENT
// ========================================

const weekTitle =
    document.getElementById("weekTitle");

const weekColumns =
    document.getElementById("weekColumns");

const timeLabels =
    document.getElementById("timeLabels");

const modal =
    document.getElementById("modal");

const selectedDateElement =
    document.getElementById("selectedDate");

const noteTime =
    document.getElementById("noteTime");

const noteTitle =
    document.getElementById("noteTitle");

const noteContent =
    document.getElementById("noteContent");

const createdBy =
    document.getElementById("createdBy");

const existingNotes =
    document.getElementById("existingNotes");

const saveBtn =
    document.getElementById("saveBtn");

const deleteBtn =
    document.getElementById("deleteBtn");


// ========================================
// TẠO NHÃN GIỜ
// ========================================

function createTimeLabels() {

    timeLabels.innerHTML = "";

    for (
        let hour = 0;
        hour < 24;
        hour++
    ) {

        const label =
            document.createElement("div");

        label.className =
            "time-label";


        let displayHour;

        if (hour === 0) {

            displayHour = "12 AM";

        } else if (hour < 12) {

            displayHour =
                `${hour} AM`;

        } else if (hour === 12) {

            displayHour = "12 PM";

        } else {

            displayHour =
                `${hour - 12} PM`;
        }


        label.textContent =
            displayHour;


        timeLabels.appendChild(label);
    }
}


// ========================================
// HIỂN THỊ LỊCH TUẦN
// ========================================

async function loadCalendar() {

    weekColumns.innerHTML = "";


    const weekEnd =
        new Date(currentWeekStart);

    weekEnd.setDate(
        weekEnd.getDate() + 6
    );


    updateWeekTitle(
        currentWeekStart,
        weekEnd
    );


    const startDate =
        formatDate(currentWeekStart);

    const endDate =
        formatDate(weekEnd);


    // ====================================
    // LẤY DỮ LIỆU SUPABASE
    // ====================================

    const { data, error } =
        await supabaseClient
            .from("calendar_notes")
            .select("*")
            .gte(
                "event_date",
                startDate
            )
            .lte(
                "event_date",
                endDate
            )
            .order(
                "event_time",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(error);

        alert(
            "Không thể tải dữ liệu Calendar."
        );

        return;
    }


    const notes =
        data || [];


    // ====================================
    // TẠO 7 CỘT
    // ====================================

    for (
        let i = 0;
        i < 7;
        i++
    ) {

        const date =
            new Date(
                currentWeekStart
            );

        date.setDate(
            date.getDate() + i
        );


        createDayColumn(
            date,
            notes
        );
    }
}


// ========================================
// TẠO CỘT NGÀY
// ========================================

function createDayColumn(
    date,
    allNotes
) {

    const column =
        document.createElement("div");

    column.className =
        "day-column";


    // ====================================
    // HEADER
    // ====================================

    const header =
        document.createElement("div");

    header.className =
        "day-header";


    if (isToday(date)) {

        header.classList.add(
            "today"
        );
    }


    const dayName =
        document.createElement("div");

    dayName.className =
        "day-name";

    dayName.textContent =
        getDayName(date);


    const dayNumber =
        document.createElement("div");

    dayNumber.className =
        "day-number";

    dayNumber.textContent =
        date.getDate();


    header.appendChild(
        dayName
    );

    header.appendChild(
        dayNumber
    );


    column.appendChild(
        header
    );


    // ====================================
    // KHUNG 24 GIỜ
    // ====================================

    const hourGrid =
        document.createElement("div");

    hourGrid.className =
        "hour-grid";


    // ====================================
    // LẤY NOTE CỦA NGÀY
    // ====================================

    const dateString =
        formatDate(date);


    const dayNotes =
        allNotes.filter(
            note =>
                note.event_date ===
                dateString
        );


    // ====================================
    // CLICK VÀO KHUNG GIỜ
    // ====================================

    hourGrid.addEventListener(
        "click",
        event => {

            // Nếu click trực tiếp vào event
            // thì không tạo note mới

            if (
                event.target.closest(
                    ".calendar-event"
                )
            ) {
                return;
            }


            const rect =
                hourGrid.getBoundingClientRect();


            const y =
                event.clientY -
                rect.top +
                hourGrid.scrollTop;


            let totalMinutes =
                Math.floor(
                    y / 60 * 60
                );


            // Làm tròn về mỗi 15 phút

            totalMinutes =
                Math.round(
                    totalMinutes / 15
                ) * 15;


            if (
                totalMinutes < 0
            ) {
                totalMinutes = 0;
            }


            if (
                totalMinutes > 1439
            ) {
                totalMinutes = 1439;
            }


            const hour =
                Math.floor(
                    totalMinutes / 60
                );


            const minute =
                totalMinutes % 60;


            const time =
                String(hour)
                    .padStart(2, "0")
                + ":" +
                String(minute)
                    .padStart(2, "0");


            openNewNote(
                date,
                time,
                dayNotes
            );
        }
    );


    // ====================================
    // TẠO ĐƯỜNG NỬA GIỜ
    // ====================================

    for (
        let hour = 0;
        hour < 24;
        hour++
    ) {

        const halfHour =
            document.createElement("div");

        halfHour.className =
            "half-hour";


        halfHour.style.top =
            `${hour * 60 + 30}px`;


        hourGrid.appendChild(
            halfHour
        );
    }


    // ====================================
    // HIỂN THỊ CÁC NOTE
    // ====================================

    dayNotes.forEach(
        note => {

            createEvent(
                note,
                hourGrid,
                date,
                dayNotes
            );
        }
    );


    column.appendChild(
        hourGrid
    );


    weekColumns.appendChild(
        column
    );
}


// ========================================
// TẠO EVENT
// ========================================

function createEvent(
    note,
    hourGrid,
    date,
    dayNotes
) {

    const event =
        document.createElement("div");

    event.className =
        "calendar-event";


    // ====================================
    // NOTE CŨ KHÔNG CÓ GIỜ
    // ====================================

    if (!note.event_time) {

        event.style.top =
            "5px";

        event.style.minHeight =
            "42px";

    } else {

        const parts =
            note.event_time
                .substring(0, 5)
                .split(":");


        const hour =
            parseInt(parts[0], 10);


        const minute =
            parseInt(parts[1], 10);


        const top =
            hour * 60 + minute;


        event.style.top =
            `${top}px`;
    }


    // ====================================
    // CHIỀU CAO
    // ====================================

    event.style.height =
        "54px";


    // ====================================
    // GIỜ
    // ====================================

    const time =
        document.createElement("div");

    time.className =
        "event-time";


    if (note.event_time) {

        time.textContent =
            note.event_time
                .substring(0, 5);

    } else {

        time.textContent =
            "Cả ngày";
    }


    // ====================================
    // TIÊU ĐỀ
    // ====================================

    const title =
        document.createElement("div");

    title.className =
        "event-title";

    title.textContent =
        note.title ||
        "Không có tiêu đề";


    // ====================================
    // NỘI DUNG
    // ====================================

    const content =
        document.createElement("div");

    content.className =
        "event-content";

    content.textContent =
        note.content || "";


    event.appendChild(
        time
    );

    event.appendChild(
        title
    );

    if (note.content) {

        event.appendChild(
            content
        );
    }


    // ====================================
    // CLICK EVENT
    // ====================================

    event.addEventListener(
        "click",
        eventClick => {

            eventClick.stopPropagation();


            openEditNote(
                note,
                date,
                dayNotes
            );
        }
    );


    hourGrid.appendChild(
        event
    );
}


// ========================================
// MỞ NOTE MỚI
// ========================================

function openNewNote(
    date,
    time,
    dayNotes
) {

    selectedDate =
        formatDate(date);


    selectedNote =
        null;


    selectedDateElement.textContent =
        formatDateVietnamese(
            date
        );


    noteTime.value =
        time;


    noteTitle.value =
        "";

    noteContent.value =
        "";

    createdBy.value =
        "";


    saveBtn.textContent =
        "Lưu";


    deleteBtn.style.display =
        "none";


    renderExistingNotes(
        dayNotes
    );


    modal.classList.add(
        "show"
    );
}


// ========================================
// MỞ NOTE ĐỂ SỬA
// ========================================

function openEditNote(
    note,
    date,
    dayNotes
) {

    selectedDate =
        formatDate(date);


    selectedNote =
        note;


    selectedDateElement.textContent =
        formatDateVietnamese(
            date
        );


    noteTime.value =
        note.event_time
            ? note.event_time.substring(
                0,
                5
            )
            : "";


    noteTitle.value =
        note.title || "";


    noteContent.value =
        note.content || "";


    createdBy.value =
        note.created_by || "";


    saveBtn.textContent =
        "Cập nhật";


    deleteBtn.style.display =
        "inline-block";


    renderExistingNotes(
        dayNotes
    );


    modal.classList.add(
        "show"
    );
}


// ========================================
// HIỂN THỊ NOTE TRONG NGÀY
// ========================================

function renderExistingNotes(
    notes
) {

    existingNotes.innerHTML = "";


    if (
        !notes ||
        notes.length === 0
    ) {

        return;
    }


    const title =
        document.createElement("div");

    title.textContent =
        "Ghi chú trong ngày";

    title.style.fontWeight =
        "bold";

    title.style.marginBottom =
        "8px";


    existingNotes.appendChild(
        title
    );


    notes.forEach(
        note => {

            const item =
                document.createElement("div");

            item.className =
                "existing-note";


            const itemTitle =
                document.createElement(
                    "div"
                );

            itemTitle.className =
                "existing-note-title";


            const time =
                note.event_time
                    ? note.event_time
                        .substring(0, 5)
                    : "Cả ngày";


            itemTitle.textContent =
                `🕐 ${time} — ${note.title}`;


            item.appendChild(
                itemTitle
            );


            if (note.content) {

                const itemContent =
                    document.createElement(
                        "div"
                    );

                itemContent.style.marginTop =
                    "5px";

                itemContent.style.fontSize =
                    "13px";

                itemContent.style.color =
                    "#c4c7ca";

                itemContent.textContent =
                    note.content;


                item.appendChild(
                    itemContent
                );
            }


            const info =
                document.createElement(
                    "div"
                );

            info.className =
                "existing-note-info";


            let infoText = "";


            if (note.created_by) {

                infoText =
                    `👤 ${note.created_by}`;
            }


            if (note.updated_at) {

                if (infoText) {
                    infoText += " • ";
                }


                infoText +=
                    "Cập nhật " +
                    new Date(
                        note.updated_at
                    ).toLocaleString(
                        "vi-VN",
                        {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                        }
                    );
            }


            info.textContent =
                infoText;


            item.appendChild(
                info
            );


            // ==========================
            // NÚT SỬA
            // ==========================

            const editButton =
                document.createElement(
                    "button"
                );

            editButton.textContent =
                "✏️ Sửa";


            editButton.style.marginTop =
                "8px";


            editButton.style.padding =
                "6px 10px";


            editButton.style.border =
                "none";


            editButton.style.borderRadius =
                "6px";


            editButton.style.cursor =
                "pointer";


            editButton.addEventListener(
                "click",
                event => {

                    event.stopPropagation();


                    openEditNote(
                        note,
                        parseDate(
                            note.event_date
                        ),
                        notes
                    );
                }
            );


            item.appendChild(
                editButton
            );


            existingNotes.appendChild(
                item
            );
        }
    );
}


// ========================================
// LƯU NOTE
// ========================================

async function saveNote() {

    const time =
        noteTime.value;


    const title =
        noteTitle.value.trim();


    const content =
        noteContent.value.trim();


    const user =
        createdBy.value.trim();


    if (!title) {

        alert(
            "Bạn chưa nhập tiêu đề."
        );

        return;
    }


    // ====================================
    // CẬP NHẬT
    // ====================================

    if (selectedNote) {

        const { error } =
            await supabaseClient
                .from(
                    "calendar_notes"
                )
                .update({

                    event_time:
                        time || null,

                    title:
                        title,

                    content:
                        content,

                    created_by:
                        user,

                    updated_at:
                        new Date()
                            .toISOString()

                })
                .eq(
                    "id",
                    selectedNote.id
                );


        if (error) {

            console.error(error);

            alert(
                "Không thể cập nhật ghi chú."
            );

            return;
        }

    }

    // ====================================
    // TẠO MỚI
    // ====================================

    else {

        const { error } =
            await supabaseClient
                .from(
                    "calendar_notes"
                )
                .insert({

                    event_date:
                        selectedDate,

                    event_time:
                        time || null,

                    title:
                        title,

                    content:
                        content,

                    created_by:
                        user

                });


        if (error) {

            console.error(error);

            alert(
                "Không thể lưu ghi chú."
            );

            return;
        }
    }


    closeModal();

    await loadCalendar();
}


// ========================================
// XÓA NOTE
// ========================================

async function deleteNote() {

    if (!selectedNote) {

        closeModal();

        return;
    }


    const confirmDelete =
        confirm(
            "Bạn có chắc muốn xóa ghi chú này?"
        );


    if (!confirmDelete) {

        return;
    }


    const { error } =
        await supabaseClient
            .from(
                "calendar_notes"
            )
            .delete()
            .eq(
                "id",
                selectedNote.id
            );


    if (error) {

        console.error(error);

        alert(
            "Không thể xóa ghi chú."
        );

        return;
    }


    closeModal();

    await loadCalendar();
}


// ========================================
// ĐÓNG MODAL
// ========================================

function closeModal() {

    modal.classList.remove(
        "show"
    );


    selectedNote =
        null;
}


// ========================================
// TUẦN TRƯỚC
// ========================================

document
    .getElementById("prevWeek")
    .addEventListener(
        "click",
        () => {

            currentWeekStart =
                new Date(
                    currentWeekStart
                );


            currentWeekStart.setDate(
                currentWeekStart.getDate() - 7
            );


            loadCalendar();
        }
    );


// ========================================
// TUẦN SAU
// ========================================

document
    .getElementById("nextWeek")
    .addEventListener(
        "click",
        () => {

            currentWeekStart =
                new Date(
                    currentWeekStart
                );


            currentWeekStart.setDate(
                currentWeekStart.getDate() + 7
            );


            loadCalendar();
        }
    );


// ========================================
// HÔM NAY
// ========================================

document
    .getElementById("todayBtn")
    .addEventListener(
        "click",
        () => {

            currentWeekStart =
                getMonday(
                    new Date()
                );


            loadCalendar();
        }
    );


// ========================================
// LƯU
// ========================================

saveBtn.addEventListener(
    "click",
    saveNote
);


// ========================================
// XÓA
// ========================================

deleteBtn.addEventListener(
    "click",
    deleteNote
);


// ========================================
// ĐÓNG
// ========================================

document
    .getElementById("closeModal")
    .addEventListener(
        "click",
        closeModal
    );


document
    .getElementById("cancelBtn")
    .addEventListener(
        "click",
        closeModal
    );


// ========================================
// CLICK RA NGOÀI
// ========================================

modal.addEventListener(
    "click",
    event => {

        if (
            event.target === modal
        ) {

            closeModal();
        }
    }
);


// ========================================
// LẤY THỨ 2 CỦA TUẦN
// ========================================

function getMonday(
    date
) {

    const result =
        new Date(date);


    const day =
        result.getDay();


    const diff =
        day === 0
            ? -6
            : 1 - day;


    result.setDate(
        result.getDate() + diff
    );


    result.setHours(
        0,
        0,
        0,
        0
    );


    return result;
}

// ========================================
// TIÊU ĐỀ TUẦN
// ========================================

function updateWeekTitle(
    startDate,
    endDate
) {

    const startDay =
        startDate.getDate();

    const startMonth =
        startDate.getMonth() + 1;

    const endDay =
        endDate.getDate();

    const endMonth =
        endDate.getMonth() + 1;

    const year =
        startDate.getFullYear();


    if (
        startMonth === endMonth
    ) {

        weekTitle.textContent =
            `${startDay} – ${endDay}/${startMonth}/${year}`;

    } else {

        weekTitle.textContent =
            `${startDay}/${startMonth} – ${endDay}/${endMonth}/${year}`;
    }
}

// ========================================
// TÊN THỨ
// ========================================

function getDayName(
    date
) {

    const names = [
        "CN",
        "THỨ 2",
        "THỨ 3",
        "THỨ 4",
        "THỨ 5",
        "THỨ 6",
        "THỨ 7"
    ];


    return names[
        date.getDay()
    ];
}


// ========================================
// FORMAT DATE
// ========================================

function formatDate(
    date
) {

    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${year}-${month}-${day}`;
}


// ========================================
// PARSE DATE
// ========================================

function parseDate(
    dateString
) {

    const parts =
        dateString.split("-");


    return new Date(
        Number(parts[0]),
        Number(parts[1]) - 1,
        Number(parts[2])
    );
}


// ========================================
// FORMAT NGÀY TIẾNG VIỆT
// ========================================

function formatDateVietnamese(
    date
) {

    return date.toLocaleDateString(
        "vi-VN",
        {
            weekday: "long",
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );
}


// ========================================
// HÔM NAY?
// ========================================

function isToday(
    date
) {

    const today =
        new Date();


    return (
        date.getFullYear() ===
            today.getFullYear() &&

        date.getMonth() ===
            today.getMonth() &&

        date.getDate() ===
            today.getDate()
    );
}


// ========================================
// KHỞI ĐỘNG
// ========================================

createTimeLabels();

loadCalendar();
