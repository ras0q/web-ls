-- NOTE: Set `vim.opt.exrc = true` in your init.lua to use local config files for each project

--- @type vim.lsp.Config
local crawl_ls_config = {
  cmd = { "deno", "task", "dev" },
  filetypes = { "markdown" },
  root_markers = { ".git" },
  single_file_support = true,
}

vim.lsp.config("crawl_ls", crawl_ls_config)

vim.lsp.enable({ "crawl_ls" })
