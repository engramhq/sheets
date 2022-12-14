import { getAllRows, getSheet, updateRow, updateSheet } from "./db";
import { ImageModal } from "./ImageModal";

async function run() {
  const rows = await getAllRows();

  const root = document.createElement("div");

  document.body.append(root);

  const sheet = await getSheet();

  const table = document.createElement("table");
  table.style.overflowX = "auto";
  table.style.display = "block";

  const row = document.createElement("tr");

  for (const column of sheet.columns) {
    const columnElement = document.createElement("td");

    columnElement.style.borderBottom = "1px solid black";
    columnElement.style.width = "200px";

    columnElement.innerText = column.title;

    row.append(columnElement);
  }

  const tdAddColumn = document.createElement("td");

  tdAddColumn.style.borderBottom = "1px solid black";
  tdAddColumn.style.width = "200px";

  const btnAdd = document.createElement("button");
  btnAdd.innerText = "+"
  tdAddColumn.appendChild(btnAdd);
  btnAdd.addEventListener("click", () => {
    const title = prompt("title") || "";
    const type = (prompt("type", "text") || "text") as "text" | "image";

    updateSheet(1, {
      columns: [
        ...sheet.columns,
        {
          type,
          title
        }
      ]
    })

    window.location.reload();
  });

  row.append(tdAddColumn);

  table.append(row);

  function ColImage(imgSrc: string) {
    const image = document.createElement("img");
    image.style.width = "100px";
    image.style.height = "100px";
    image.style.objectFit = "contain";
    image.src = imgSrc;

    image.addEventListener("click", () => {
      document.body.appendChild(ImageModal({img: imgSrc}));
    })

    return image;
  }

  for (let i = 0; i < 1000; i++) {
    const dataRow = rows[i];

    const rowEl = document.createElement("tr");
    rowEl.style.borderBottom = "1px solid black";

    for (let j = 0; j < sheet.columns.length; j++) {
      const dataType = sheet.columns[j];
      if (!dataType) {
        continue;
      }

      const colEl = document.createElement("td");
      colEl.style.borderBottom = "1px solid black";
      colEl.style.minWidth = "200px";
      colEl.style.maxWidth = "200px";

      if (dataType.type === "image") {
        if (dataRow?.columns[j]) {
          colEl.append(ColImage(dataRow?.columns[j]));
        }

        colEl.addEventListener("dragover", (e) => {
          e.preventDefault();
        });
        colEl.addEventListener("drop", (ev) => {
          ev.preventDefault();
          if (!ev.dataTransfer) {
            return;
          }

          if (ev.dataTransfer.items) {
            // Use DataTransferItemList interface to access the file(s)
            [...ev.dataTransfer.items].forEach((item) => {
              // If dropped items aren't files, reject them
              if (item.kind === "file") {
                const file = item.getAsFile();
                if (file) {
                  const reader = new FileReader();

                  reader.onload = (e) => {
                    colEl.innerHTML = "";
                    colEl.append(ColImage(e.target?.result as string));

                    setTimeout(async () => {
                      const updatedColumns = [...dataRow.columns];
                      updatedColumns[j] = e.target?.result as string;

                      await updateRow(i + 1, {
                        columns: updatedColumns,
                      });
                    }, 0);
                  };

                  reader.readAsDataURL(file);
                }
              }
            });
          }
        });

        colEl.addEventListener("click", () => {
          console.log("click", i);
        });
      } else {
        colEl.contentEditable = "true";
        colEl.style.outline = "none";
        colEl.innerText = dataRow?.columns[j] || "";

        colEl.addEventListener("blur", async () => {
          const updatedColumns = [...dataRow.columns];
          updatedColumns[j] = colEl.innerText;

          await updateRow(i + 1, {
            columns: updatedColumns,
          });
        });
      }

      rowEl.append(colEl);
    }

    table.append(rowEl);
  }

  root.append(table);
}

run();
