using BlogProject.Application.Interfaces;
using Microsoft.EntityFrameworkCore.Storage;

namespace BlogProject.Persistence.Repository;

public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _ctx;
    private readonly Dictionary<Type, object> _repos = new();
    private IDbContextTransaction? _transaction;

    public UnitOfWork(AppDbContext ctx) => _ctx = ctx;

    public IRepository<T> Repository<T>() where T : class
    {
        var t = typeof(T);
        if (!_repos.TryGetValue(t, out var repo))
        {
            repo = new EfRepository<T>(_ctx);
            _repos[t] = repo;
        }
        return (IRepository<T>)repo;
    }

    public Task<int> SaveChangesAsync(CancellationToken ct = default) => _ctx.SaveChangesAsync(ct);

    public async Task BeginTransactionAsync() => _transaction = await _ctx.Database.BeginTransactionAsync();
    public async Task CommitTransactionAsync()
    {
        if (_transaction != null)
        {
            await _transaction.CommitAsync();
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }
    public async Task RollbackTransactionAsync()
    {
        if (_transaction != null)
        {
            await _transaction.RollbackAsync();
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }

    public void Dispose()
    {
        _transaction?.Dispose();
        _ctx.Dispose();
    }
}
