#include <cstdio>
#include <cstring>
#include <string>
#include <sys/stat.h>
#include "CascLib.h"

static int fail(const char * what)
{
    fprintf(stderr, "%s failed: error %u\n", what, GetCascError());
    return 1;
}

static void mkdirs(const std::string & path)
{
    for(size_t i = 1; i < path.size(); i++)
    {
        if(path[i] == '/')
            mkdir(path.substr(0, i).c_str(), 0755);
    }
}

static std::string toRelativePath(const char * name)
{
    std::string rel = name;
    for(char & c : rel)
    {
        if(c == ':' || c == '\\')
            c = '/';
    }
    return rel;
}

static int extractOne(HANDLE hStorage, const char * name, const std::string & outDir)
{
    HANDLE hFile;
    if(!CascOpenFile(hStorage, name, CASC_LOCALE_ALL, CASC_OPEN_BY_NAME, &hFile))
        return fail(name);

    std::string outPath = outDir + "/" + toRelativePath(name);
    mkdirs(outPath);
    FILE * out = fopen(outPath.c_str(), "wb");
    if(out == NULL)
    {
        perror(outPath.c_str());
        CascCloseFile(hFile);
        return 1;
    }

    char buffer[0x10000];
    DWORD read = 0;
    unsigned long long total = 0;
    while(CascReadFile(hFile, buffer, sizeof(buffer), &read) && read != 0)
    {
        fwrite(buffer, 1, read, out);
        total += read;
    }
    fclose(out);
    CascCloseFile(hFile);
    printf("%llu\t%s\n", total, outPath.c_str());
    return 0;
}

template <typename Visit>
static int forEachMatch(HANDLE hStorage, const char * mask, Visit visit)
{
    CASC_FIND_DATA fd;
    HANDLE hFind = CascFindFirstFile(hStorage, mask, &fd, NULL);
    if(hFind == NULL)
    {
        fprintf(stderr, "no file matches %s\n", mask);
        return 1;
    }

    int rc = 0;
    do
    {
        rc |= visit(fd);
    } while(CascFindNextFile(hFind, &fd));
    CascFindClose(hFind);
    return rc;
}

int main(int argc, char ** argv)
{
    // CascOpenStorage segfaults on an empty path instead of returning an error.
    if(argc < 4 || argv[1][0] == '\0')
    {
        fprintf(stderr,
                "usage: %s <install dir> list <mask>\n"
                "       %s <install dir> extract <out dir> <mask>...\n",
                argv[0], argv[0]);
        return 2;
    }

    HANDLE hStorage;
    if(!CascOpenStorage(argv[1], 0, &hStorage))
        return fail("CascOpenStorage");

    int rc = 0;
    if(!strcmp(argv[2], "list"))
    {
        rc = forEachMatch(hStorage, argv[3], [](const CASC_FIND_DATA & fd) {
            printf("%llu\t%s\n", (unsigned long long)fd.FileSize, fd.szFileName);
            return 0;
        });
    }
    else if(!strcmp(argv[2], "extract") && argc >= 5)
    {
        std::string outDir = argv[3];
        for(int i = 4; i < argc; i++)
        {
            rc |= forEachMatch(hStorage, argv[i], [&](const CASC_FIND_DATA & fd) {
                return extractOne(hStorage, fd.szFileName, outDir);
            });
        }
    }
    else
    {
        fprintf(stderr, "unknown command or missing arguments: %s\n", argv[2]);
        rc = 2;
    }

    CascCloseStorage(hStorage);
    return rc;
}
