import { Component } from '@angular/core';
import { Util } from './util';

@Component({
  selector: 'app-tree-table',
  templateUrl: './tree-table.component.html',
  styleUrls: ['./tree-table.component.css']
})
export class TreeTableComponent {

  input: string = ''
  data: TreeData[] = structuredClone(Util.Data);
  tableDataDeepCopy: Array<TreeData> = [];
  allExpandedNodeList: Array<TreeData> = []
  currentExpandedRow = Object.assign({});
  ascendingOrder: boolean = false;
  breadCrumbs: Array<number | null> = []
  config = {
    collapseAllOnExpand: true,    // callapse all other expanded rows when expnading a new row
    collapseOtherChildOnExpand: false,    // callapse all other child rows when expnading a new child row 
    paddinggLeft: 20
  }
  keysAndTypes: any

  constructor() { }

  ngOnInit(): void {
    this.data = this.data.map((m: TreeData) => { return { ...m, expanded: false, level: 1, class: m.data.uuid } })
    this.tableDataDeepCopy = structuredClone(this.data)
    this.getObjectKeysAndTypes()
  }

  search() {
    const temp = structuredClone(this.tableDataDeepCopy.map((m) => { return { ...m, expanded: false } }))
    if (this.input.length) {
      this.data = temp.filter(m => m.data.title.toLowerCase().includes(this.input.toLowerCase()))
    } else {
      this.data = temp
    }
  }

  recursive(item: TreeData, idx: number) {
    item.expanded = true
    this.allExpandedNodeList.push(item)
    if (item.children && item.children.length) {
      item.children.forEach((m, i) => {
        m.level = item.level + 1;
        m.paddingLeft = `${(m.level * this.config.paddinggLeft) - this.config.paddinggLeft}px`
        m.class = `${item.class}__${m.data.uuid}`
        m.children ? this.recursive(m, i) : this.allExpandedNodeList.push(m)
      })
    }
  }

  expandAll(): void {
    this.allExpandedNodeList = []
    const temp = structuredClone(this.tableDataDeepCopy)
    temp.forEach((item, idx) => {
      this.recursive(item, idx)
    })
    this.data = structuredClone(this.allExpandedNodeList)
    this.getBreadCrumbs()
  }

  getBreadCrumbs() {
    this.breadCrumbs = []
    const levels = new Set([...Array.from(this.data, ({ level }) => level)])
    levels.forEach((level, index) => {
      if (index > 0) {
        const elements: Array<TreeData> = this.data.filter(m => m.level == level)
        this.breadCrumbs.push(elements.length)
      }
    })
    this.config.collapseAllOnExpand && this.breadCrumbs.splice(0, 1)
  }

  collapseAll(): void {
    this.data = structuredClone(this.tableDataDeepCopy.map((m) => { return { ...m, expanded: false } }))
    this.getBreadCrumbs()
  }

  expandRow(item: TreeData, idx: number): void {

    // for callapsing the pervious expanded row
    if (Object.keys(this.currentExpandedRow).length && item.level == 1 && this.config.collapseAllOnExpand) {
      this.collapseRow(this.currentExpandedRow.data, this.currentExpandedRow.index)
      idx = this.data.findIndex((m: TreeData) => m.data.uuid == item.data.uuid)
      item = this.data[idx]
    }

    item.expanded = true
    item.children?.forEach((m, i) => {
      m.expanded = false;
      m.level = item.level + 1;
      m.topParentId = this.data.find(m => m['expanded'] && m['level'] == 1)?.data.uuid
      m.paddingLeft = `${(m.level * this.config.paddinggLeft) - this.config.paddinggLeft}px`
      m.class = `${item.class}__${m.data.uuid}`
      this.data.splice(idx + 1 + i, 0, m)
    })

    if (item.level == 1 && this.config.collapseAllOnExpand) {
      this.currentExpandedRow.index = idx
      this.currentExpandedRow.data = item
    }

    if (item.level > 1 && this.config.collapseOtherChildOnExpand) {
      let data = this.data.find((m) => m.level == item.level && m.expanded && m.data.uuid != item.data.uuid)
      let index = this.data.findIndex(m => m.data.uuid == data?.data.uuid)
      data && this.collapseRow(data, index)
      data ? data.expanded = false : ''
    }

    this.getBreadCrumbs()

  }

  getCount(level: number) {
    let array = this.data.filter((m: TreeData) => (m.topParentId == this.currentExpandedRow.data.data.uuid && m.level == level))
    let count = 0
    array.forEach((m: any) => { if (m.expanded) count = count + m.children.length })
    return count
  }

  collapseRow(item: TreeData, idx: number): void {

    item.expanded = false
    const uuid = item.data.uuid
    let indexesToBeRemoved: any = []

    for (let i = 0; i < this.data.length; i++) {
      if (i == idx) {
        continue;
      } else if (this.data[i]['class'].includes(uuid)) {
        indexesToBeRemoved.push(i)
      }
    }

    this.data = this.data.filter((m, i) => !indexesToBeRemoved.includes(i))

    this.getBreadCrumbs()

  }

  getObjectKeysAndTypes() {
    const array = Object.entries(this.data[0].data)
    this.keysAndTypes = array.map((m) => { return [m[0], typeof m[1]] })
    this.keysAndTypes = Object.fromEntries(this.keysAndTypes)
  }

  sort(key: any): void {
    if (this.data.length) {
      const temp = structuredClone(this.tableDataDeepCopy)
      this.ascendingOrder = !this.ascendingOrder
      switch (this.keysAndTypes[key]) {
        case 'string':
          this.data = this.ascendingOrder ? temp.sort((a: any, b: any) => a.data[key].localeCompare(b.data[key])) : temp.sort((a: any, b: any) => b.data.title.localeCompare(a.data[key]))
          return;
        case 'number':
          this.data = this.ascendingOrder ? temp.sort((a: any, b: any) => a.data[key] > b.data[key] ? -1 : 1) : temp.sort((a: any, b: any) => a.data[key] < b.data[key] ? -1 : 1);
          return;
      }
    }
  }

}

export interface TreeData {
  data: TableRow
  expanded: boolean
  level: number
  topParentId: string | unknown
  paddingLeft: string
  class: string
  children: Array<TreeData> | null
}

export interface TableRow {
  uuid: string,
  title: string,
  parent: string | null,
  total_risk_score: number,
  total_readiness_score: number,
  total_purchase_price: number,
  total_res_adj_impact: number,
  total_physical_impact: number,
  total_vulnerability_score: number,
  avg_risk_score: number,
  avg_readiness_score: number,
  avg_res_adj_impact: number,
  avg_physical_impact: number,
  avg_vulnerability_score: number,
  avg_value_at_risk: number,
  avg_market_value: number,
  tier_4: string,
  scenario: string
}